import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { BusinessException } from '../../../common/exceptions/app.exceptions';
import {
  CreateVirtualAccountInput,
  CreateVirtualAccountResult,
  ParsedWebhookPayment,
  VirtualAccountProvider,
} from './virtual-account-provider.interface';

/**
 * Paystack Dedicated Virtual Accounts — Financial Services flow.
 *
 * For businesses classified as Financial Services, Paystack requires the
 * single-step `/dedicated_account/assign` endpoint which includes BVN
 * validation inline. This is async — Paystack responds immediately with
 * "Assign dedicated account in progress" and delivers the actual account
 * number via the `dedicatedaccount.assign.success` webhook.
 *
 * We store a PENDING virtual account immediately and update it when the
 * webhook arrives with the real account number.
 *
 * Required env vars:
 *   PAYSTACK_SECRET_KEY       — live or test key
 *   PAYSTACK_PREFERRED_BANK   — "titan-paystack" or "wema-bank" (live), "test-bank" (test)
 *   PAYSTACK_BASE_URL         — defaults to https://api.paystack.co
 */
@Injectable()
export class PaystackVirtualAccountProvider implements VirtualAccountProvider {
  readonly providerType = 'PAYSTACK';
  private readonly logger = new Logger(PaystackVirtualAccountProvider.name);

  constructor(private readonly config: ConfigService) {}

  async createVirtualAccount(input: CreateVirtualAccountInput): Promise<CreateVirtualAccountResult> {
    const [firstName, ...rest] = input.customerName.trim().split(/\s+/);
    const lastName = rest.join(' ') || firstName;
    const email = input.customerEmail ?? `customer-${input.customerId}@no-email.vclop.local`;
    const phone = this.normalizePhone(input.customerPhone);
    const bank = this.preferredBank;
    const isLive = this.secretKey.startsWith('sk_live_');

    // ── Test mode: use multi-step (synchronous, no BVN needed) ───────────
    if (!isLive || bank === 'test-bank') {
      return this.createViaMultiStep(firstName, lastName, email, phone, input);
    }

    // ── Live mode: use /assign endpoint (Financial Services requirement) ──
    if (!input.customerBvn) {
      throw new BusinessException(
        'Customer BVN is required to create a virtual account. ' +
        'Please update the customer profile with a valid 11-digit BVN first.',
      );
    }

    // The /assign endpoint validates BVN + bank account asynchronously.
    // bank_code and account_number improve validation accuracy and are REQUIRED for live mode.
    const payload: Record<string, string> = {
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      preferred_bank: bank,
      country: 'NG',
      bvn: input.customerBvn,
    };

    // Include bank details if available — improves validation accuracy
    if (input.customerBankAccount) {
      payload.account_number = input.customerBankAccount;
    }
    if (input.customerBankCode) {
      payload.bank_code = input.customerBankCode;
    }

    try {
      await this.request('POST', '/dedicated_account/assign', payload);
      this.logger.log(`DVA assignment submitted for ${email} — awaiting dedicatedaccount.assign.success webhook`);
    } catch (err) {
      const msg = (err as Error).message ?? '';
      if (msg.includes('not identified') || msg.includes('Customer has not been identified')) {
        throw new BusinessException(
          'BVN validation failed — the customer\'s BVN does not match NIBSS records. ' +
          'Verify the BVN is the correct 11-digit number for this customer.',
        );
      }
      if (msg.includes('generate account number') || msg.includes('Could not generate')) {
        throw new BusinessException(
          'Paystack could not generate an account number. ' +
          'Confirm the customer\'s BVN is correct and try again.',
        );
      }
      throw err;
    }

    // Return a pending placeholder — overwritten when dedicatedaccount.assign.success webhook arrives
    return {
      providerCustomerId: `PENDING-${input.customerId}`,
      providerAccountId:  `PENDING-${Date.now()}`,
      accountNumber:      'PENDING',
      accountName:        `${firstName} ${lastName}`,
      bankName:           bank === 'titan-paystack' ? 'Titan Paystack' : 'Wema Bank',
    };
  }

  private async createViaMultiStep(
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    input: CreateVirtualAccountInput,
  ): Promise<CreateVirtualAccountResult> {
    // Step 1: Create or fetch Paystack customer
    let customerCode: string;
    try {
      const customer = await this.request<{ customer_code: string }>('POST', '/customer', {
        email, first_name: firstName, last_name: lastName, phone,
      });
      customerCode = customer.customer_code;
    } catch {
      try {
        const existing = await this.request<{ customer_code: string }>('GET', `/customer/${encodeURIComponent(email)}`);
        customerCode = existing.customer_code;
        this.logger.log(`Reusing existing Paystack customer ${customerCode}`);
      } catch (inner) { throw inner; }
    }

    // Step 2: BVN identification (best-effort — test mode may skip this)
    if (input.customerBvn) {
      try {
        await this.request('POST', `/customer/${customerCode}/identification`, {
          country: 'NG', type: 'bvn', value: input.customerBvn,
          first_name: firstName, last_name: lastName,
        });
        // Poll up to 10 × 3s for validation
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 3000));
          try {
            const cData = await this.request<{ identified: boolean }>('GET', `/customer/${customerCode}`);
            if (cData.identified) { this.logger.log(`BVN validated after ${i + 1} poll(s)`); break; }
          } catch { /* keep polling */ }
        }
      } catch (bvnErr) {
        this.logger.warn(`BVN identification skipped: ${(bvnErr as Error).message}`);
      }
    }

    // Step 3: Create DVA
    const dva = await this.request<{
      id: number;
      account_number: string;
      account_name: string;
      bank: { name: string; slug: string };
    }>('POST', '/dedicated_account', {
      customer: customerCode,
      preferred_bank: this.preferredBank,
    });

    return {
      providerCustomerId: customerCode,
      providerAccountId:  String(dva.id),
      accountNumber:      dva.account_number,
      accountName:        dva.account_name,
      bankName:           dva.bank?.name ?? this.preferredBank,
    };
  }

  verifyWebhookSignature(rawBody: string | Buffer, headers: Record<string, string>): boolean {
    const signature = headers['x-paystack-signature'] ?? headers['X-Paystack-Signature'];
    if (!signature) return false;
    const hash = crypto.createHmac('sha512', this.secretKey).update(rawBody).digest('hex');
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(signature, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  parseWebhookPayload(payload: unknown): ParsedWebhookPayment | null {
    const body = payload as {
      event?: string;
      data?: {
        reference?: string; amount?: number; currency?: string; paid_at?: string;
        authorization?: {
          channel?: string;
          receiver_bank_account_number?: string;
          sender_name?: string;
          sender_bank_account_number?: string;
          narration?: string;
        };
        // DVA assign success fields
        account_number?: string;
        account_name?: string;
        customer?: { customer_code?: string; email?: string };
        bank?: { name?: string };
      };
    };

    // DVA assignment completed — update the PENDING virtual account
    if (body.event === 'dedicatedaccount.assign.success' && body.data?.account_number) {
      this.logger.log(`DVA assigned: ${body.data.account_number} for customer ${body.data.customer?.customer_code}`);
      // This is handled by the webhook controller separately — return null to skip repayment reconciliation
      return null;
    }

    if (body.event === 'dedicatedaccount.assign.failed') {
      this.logger.error(`DVA assignment failed for customer ${body.data?.customer?.customer_code}`);
      return null;
    }

    if (body.event !== 'charge.success') return null;
    const data = body.data;
    if (!data?.authorization || data.authorization.channel !== 'dedicated_nuban') return null;
    if (!data.authorization.receiver_bank_account_number || !data.reference || data.amount === undefined) return null;

    return {
      providerReference: data.reference,
      accountNumber:     data.authorization.receiver_bank_account_number,
      amount:            Number(data.amount) / 100,
      currency:          data.currency ?? 'NGN',
      payerName:         data.authorization.sender_name,
      payerAccountNumber: data.authorization.sender_bank_account_number,
      narration:         data.authorization.narration,
      receivedAt:        data.paid_at ? new Date(data.paid_at) : new Date(),
    };
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('234')) return `+${digits}`;
    if (digits.startsWith('0'))   return `+234${digits.slice(1)}`;
    return `+234${digits}`;
  }

  private get baseUrl(): string {
    return this.config.get<string>('PAYSTACK_BASE_URL') ?? 'https://api.paystack.co';
  }

  private get preferredBank(): string {
    const bank = this.config.get<string>('PAYSTACK_PREFERRED_BANK') ?? 'test-bank';
    if (this.secretKey.startsWith('sk_live_') && bank === 'test-bank') {
      throw new BusinessException(
        'PAYSTACK_PREFERRED_BANK must be set to "wema-bank" or "titan-paystack" when using a live key.',
      );
    }
    return bank;
  }

  private get secretKey(): string {
    const key = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!key) throw new BusinessException('PAYSTACK_SECRET_KEY is not configured');
    return key;
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.secretKey}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = (await response.json()) as { status: boolean; message: string; data: T };
    if (!response.ok || json.status === false) {
      this.logger.error(`Paystack ${method} ${path}: ${json.message}`);
      throw new BusinessException(`Paystack error: ${json.message ?? 'request failed'}`);
    }
    return json.data;
  }
}
