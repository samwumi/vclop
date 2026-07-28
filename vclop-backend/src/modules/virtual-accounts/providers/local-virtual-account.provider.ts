import { Injectable } from '@nestjs/common';
import {
  CreateVirtualAccountInput,
  CreateVirtualAccountResult,
  ParsedWebhookPayment,
  VirtualAccountProvider,
} from './virtual-account-provider.interface';

/**
 * Fake bank behind the same interface a real provider would implement.
 * Generates a plausible-looking 10-digit NUBAN-style account number
 * deterministically from the loanId, and accepts any webhook payload without
 * signature verification (there's no real bank to verify against). Use
 * `VirtualAccountsService.simulatePayment()` to exercise the reconciliation
 * path end to end against this provider.
 */
@Injectable()
export class LocalVirtualAccountProvider implements VirtualAccountProvider {
  readonly providerType = 'LOCAL';

  async createVirtualAccount(input: CreateVirtualAccountInput): Promise<CreateVirtualAccountResult> {
    const accountNumber = this.generateAccountNumber(input.loanId);
    return {
      providerCustomerId: `local-cust-${input.customerId.slice(0, 8)}`,
      providerAccountId: `local-acct-${input.loanId.slice(0, 8)}`,
      accountNumber,
      accountName: input.customerName.toUpperCase(),
      bankName: 'VCLOP Local Bank (Test)',
    };
  }

  verifyWebhookSignature(): boolean {
    return true; // no real bank to verify a signature against
  }

  parseWebhookPayload(payload: unknown): ParsedWebhookPayment {
    const body = payload as Record<string, unknown>;
    return {
      providerReference: String(body.reference ?? `local-${Date.now()}`),
      accountNumber: String(body.accountNumber ?? ''),
      amount: Number(body.amount ?? 0),
      currency: (body.currency as string) ?? 'NGN',
      payerName: body.payerName as string | undefined,
      payerAccountNumber: body.payerAccountNumber as string | undefined,
      narration: body.narration as string | undefined,
      receivedAt: body.receivedAt ? new Date(body.receivedAt as string) : new Date(),
    };
  }

  private generateAccountNumber(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return `90${(hash % 100000000).toString().padStart(8, '0')}`;
  }
}
