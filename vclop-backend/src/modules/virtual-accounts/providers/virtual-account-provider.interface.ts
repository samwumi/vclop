/**
 * Every virtual-account provider (Paystack, Providus, Monnify, Flutterwave,
 * Wema, or the Local/Mock provider used for testing) implements this same
 * contract. Nothing outside this `providers/` folder ever imports a
 * provider-specific SDK or type — VirtualAccountsService only ever talks to
 * this interface, resolved at runtime by VirtualAccountProviderFactory based
 * on the VIRTUAL_ACCOUNT_PROVIDER env var.
 */

export interface CreateVirtualAccountInput {
  loanId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  customerBvn?: string;
}

export interface CreateVirtualAccountResult {
  providerCustomerId?: string;
  providerAccountId?: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
}

/** The generic shape every provider must normalize its webhook payload into, regardless of that provider's own field names. */
export interface ParsedWebhookPayment {
  providerReference: string;
  accountNumber: string;
  amount: number;
  currency?: string;
  payerName?: string;
  payerAccountNumber?: string;
  narration?: string;
  receivedAt: Date;
}

export interface VirtualAccountProvider {
  readonly providerType: string;

  createVirtualAccount(input: CreateVirtualAccountInput): Promise<CreateVirtualAccountResult>;

  /** Verifies the webhook actually came from this provider (signature/HMAC check). Mock provider always returns true. */
  verifyWebhookSignature(rawBody: string | Buffer, headers: Record<string, string>): boolean;

  /**
   * Normalizes the provider's raw webhook body into the shape the
   * reconciliation logic understands. Returns null when the event isn't a
   * reconcilable account credit (e.g. Paystack sends charge.success for
   * card payments too, not just dedicated-account transfers) — the caller
   * should acknowledge with 200 OK and do nothing further, not error.
   */
  parseWebhookPayload(payload: unknown): ParsedWebhookPayment | null;
}
