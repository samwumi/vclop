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
 * Implements Dedicated Virtual Accounts against the real Paystack API.
 * Verified against Paystack's current developer docs (as of this build):
 *   - https://paystack.com/docs/api/customer/
 *   - https://paystack.com/docs/api/dedicated-virtual-account/
 *   - https://paystack.com/docs/payments/dedicated-virtual-accounts/
 *   - https://paystack.com/docs/payments/webhooks/
 *
 * Flow used here is the "multi-step" one from their docs (create customer,
 * then create a DVA for that existing customer) rather than the single-step
 * `/dedicated_account/assign` endpoint — the multi-step flow returns the
 * account details synchronously in the response, so no webhook wait is
 * needed just to finish account creation. The `/assign` endpoint is async
 * and only reports success/failure via `dedicatedaccount.assign.*` webhook
 * events, which this provider doesn't currently listen for.
 *
 * Required env vars: PAYSTACK_SECRET_KEY, PAYSTACK_BASE_URL (defaults to
 * https://api.paystack.co), PAYSTACK_PREFERRED_BANK (defaults to
 * "test-bank" — the docs' designated test-mode bank slug; set this to a
 * real bank slug such as "wema-bank" or "titan-paystack" for live mode,
 * from the Fetch Providers endpoint).
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
    if (!input.customerEmail) {
      this.logger.warn(`No email for customer ${input.customerId} — using placeholder`);
    }

    // Step 1: Create or fetch existing Paystack customer
    let customerCode: string;
    try {
      const customer = await this.request<{ customer_code: string; id: number }>('POST', '/customer', {
        email,
        first_name: firstName,
        last_name: lastName,
        phone: input.customerPhone,
      });
      customerCode = customer.customer_code;
    } catch (err) {
      // Customer may already exist — try fetching by email
      try {
        const existing = await this.request<{ customer_code: string }>('GET', `/customer/${encodeURIComponent(email)}`);
        customerCode = existing.customer_code;
        this.logger.log(`Reusing existing Paystack customer ${customerCode} for ${email}`);
      } catch {
        throw err; // rethrow original error
      }
    }

    // Step 2: Validate customer with BVN if available (required by some banks)
    if (input.customerBvn) {
      try {
        await this.request('POST', `/customer/${customerCode}/identification`, {
          country: 'NG',
          type: 'bvn',
          value: input.customerBvn,
          first_name: firstName,
          last_name: lastName,
        });
        this.logger.log(`BVN submitted for Paystack customer ${customerCode}`);
      } catch (bvnErr) {
        // BVN validation failure shouldn't block DVA creation — log and continue
        this.logger.warn(`BVN validation for ${customerCode} failed: ${(bvnErr as Error).message}`);
      }
    }

    // Step 3: Create Dedicated Virtual Account
    const dva = await this.request<{
      id: number;
      account_number: string;
      account_name: string;
      bank: { name: string; slug: string; id: number };
    }>('POST', '/dedicated_account', {
      customer: customerCode,
      preferred_bank: this.preferredBank,
    });

    return {
      providerCustomerId: customerCode,
      providerAccountId: String(dva.id),
      accountNumber: dva.account_number,
      accountName: dva.account_name,
      bankName: dva.bank?.name ?? this.preferredBank,
    };
  }

  verifyWebhookSignature(rawBody: string | Buffer, headers: Record<string, string>): boolean {
    // Header names arrive lowercased in Express/Node by convention, but check both just in case.
    const signature = headers['x-paystack-signature'] ?? headers['X-Paystack-Signature'];
    if (!signature) return false;

    const hash = crypto.createHmac('sha512', this.secretKey).update(rawBody).digest('hex');
    // Constant-time comparison to avoid leaking timing information about the expected signature.
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(signature, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  parseWebhookPayload(payload: unknown): ParsedWebhookPayment | null {
    const body = payload as {
      event?: string;
      data?: {
        reference?: string;
        amount?: number;
        currency?: string;
        paid_at?: string;
        authorization?: {
          channel?: string;
          receiver_bank_account_number?: string;
          sender_name?: string;
          sender_bank_account_number?: string;
          narration?: string;
        };
      };
    };

    // Paystack sends charge.success for every successful charge, not just
    // dedicated-account transfers (e.g. card payments too) — only a
    // dedicated_nuban-channel charge is a virtual-account credit we should
    // reconcile against a loan.
    if (body.event !== 'charge.success') return null;
    const data = body.data;
    if (!data?.authorization || data.authorization.channel !== 'dedicated_nuban') return null;
    if (!data.authorization.receiver_bank_account_number || !data.reference || data.amount === undefined) return null;

    return {
      providerReference: data.reference,
      accountNumber: data.authorization.receiver_bank_account_number,
      amount: Number(data.amount) / 100, // Paystack amounts are always in kobo (subunits)
      currency: data.currency ?? 'NGN',
      payerName: data.authorization.sender_name,
      payerAccountNumber: data.authorization.sender_bank_account_number,
      narration: data.authorization.narration,
      receivedAt: data.paid_at ? new Date(data.paid_at) : new Date(),
    };
  }

  private get baseUrl(): string {
    return this.config.get<string>('PAYSTACK_BASE_URL') ?? 'https://api.paystack.co';
  }

  private get preferredBank(): string {
    const bank = this.config.get<string>('PAYSTACK_PREFERRED_BANK') ?? 'test-bank';
    if (this.secretKey.startsWith('sk_live_') && bank === 'test-bank') {
      throw new BusinessException(
        'PAYSTACK_PREFERRED_BANK is still set to "test-bank" (or unset) while PAYSTACK_SECRET_KEY is a live key. ' +
        'Set PAYSTACK_PREFERRED_BANK to a real bank slug — "wema-bank" or "titan-paystack" — those are the only two Paystack currently supports for live Dedicated Virtual Accounts.',
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
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = (await response.json()) as { status: boolean; message: string; data: T };

    if (!response.ok || json.status === false) {
      this.logger.error(`Paystack API error on ${method} ${path}: ${json.message ?? response.statusText}`);
      throw new BusinessException(`Paystack error: ${json.message ?? 'request failed'}`);
    }

    return json.data;
  }
}
