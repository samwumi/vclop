import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { AuditAction, VirtualAccountProviderType, VirtualAccountTransactionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions/app.exceptions';
import { LoanApplicationsService } from '../loan-applications/loan-applications.service';
import { VirtualAccountProviderFactory } from './providers/virtual-account-provider.factory';
import { SimulatePaymentDto } from './dto/simulate-payment.dto';

@Injectable()
export class VirtualAccountsService {
  private readonly logger = new Logger(VirtualAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly providerFactory: VirtualAccountProviderFactory,
    private readonly loanApplicationsService: LoanApplicationsService,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(customerId?: string): Promise<unknown[]> {
    return this.prisma.virtualAccount.findMany({
      where: { ...(customerId && { customerId }) },
      include: { loan: { select: { loanNumber: true, status: true, loanApplicationId: true } }, _count: { select: { transactions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<unknown> {
    const account = await this.prisma.virtualAccount.findUnique({
      where: { id },
      include: { loan: { select: { loanNumber: true, status: true, loanApplicationId: true } }, transactions: { orderBy: { receivedAt: 'desc' } } },
    });
    if (!account) throw new ResourceNotFoundException('Virtual account', id);
    return account;
  }

  async findByLoanId(loanId: string): Promise<unknown> {
    const account = await this.prisma.virtualAccount.findUnique({
      where: { loanId },
      include: { transactions: { orderBy: { receivedAt: 'desc' } } },
    });
    if (!account) throw new ResourceNotFoundException('Virtual account for loan', loanId);
    return account;
  }

  /**
   * Every disbursed loan automatically gets a virtual account — listens for
   * the event LoanApplicationsService already emits on disbursement, so
   * neither module needs to directly depend on the other.
   */
  @OnEvent('loan.disbursed')
  async handleLoanDisbursed(payload: { loanId: string; customerId: string }): Promise<void> {
    try {
      await this.createForLoan(payload.loanId, payload.customerId);
    } catch (error) {
      this.logger.error(`Failed to auto-create virtual account for loan ${payload.loanId}`, error as Error);
    }
  }

  async createForLoanApplication(idOrLoanId: string): Promise<unknown> {
    // Try as direct loan ID first
    const directLoan = await this.prisma.loan.findFirst({
      where: { id: idOrLoanId },
      select: { id: true, customerId: true },
    });
    if (directLoan) {
      return this.createForLoan(directLoan.id, directLoan.customerId);
    }

    // Try as loanApplicationId
    const loan = await this.prisma.loan.findFirst({
      where: { loanApplicationId: idOrLoanId },
      select: { id: true, customerId: true },
    });
    if (!loan) throw new ResourceNotFoundException('Loan', idOrLoanId);
    return this.createForLoan(loan.id, loan.customerId);
  }

  async createForLoan(loanId: string, customerId: string): Promise<unknown> {
    const existing = await this.prisma.virtualAccount.findUnique({ where: { loanId } });
    if (existing) return existing;

    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new ResourceNotFoundException('Customer', customerId);

    // Read bank account fields safely — columns may not exist yet if migration is pending
    let bankAccountNumber: string | undefined;
    let bankCode: string | undefined;
    try {
      const raw = await this.prisma.$queryRaw<Array<{ bankAccountNumber: string | null; bankCode: string | null }>>`
        SELECT bankAccountNumber, bankCode FROM customers WHERE id = ${customerId}
      `;
      bankAccountNumber = raw[0]?.bankAccountNumber ?? undefined;
      bankCode = raw[0]?.bankCode ?? undefined;
    } catch {
      // Columns don't exist yet — migration pending, proceed without them
      this.logger.warn(`Bank account columns not yet in DB for customer ${customerId} — migration may be pending`);
    }

    const provider = this.providerFactory.getActiveProvider();
    const result = await provider.createVirtualAccount({
      loanId,
      customerId,
      customerName: customer.businessName ?? `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email ?? undefined,
      customerPhone: customer.phone,
      customerBvn: customer.bvn ?? undefined,
      customerBankAccountNumber: bankAccountNumber,
      customerBankCode: bankCode,
    });

    const account = await this.prisma.virtualAccount.create({
      data: {
        loanId,
        customerId,
        provider: provider.providerType as VirtualAccountProviderType,
        providerCustomerId: result.providerCustomerId,
        providerAccountId: result.providerAccountId,
        accountNumber: result.accountNumber,
        accountName: result.accountName,
        bankName: result.bankName,
      },
    });

    this.events.emit('audit.log', {
      action: AuditAction.CREATE,
      module: 'virtual-accounts',
      entityId: account.id,
      entityType: 'VirtualAccount',
      description: `Auto-created ${account.bankName} account ${account.accountNumber} for loan ${loanId}`,
      isSuccess: true,
    });

    return account;
  }

  /**
   * Real webhook entry point — the provider posts here when money lands in
   * an account. Verifies the signature, normalizes the payload, and either
   * reconciles it against the matching loan or leaves it in the
   * reconciliation queue for Accounting to resolve manually.
   */
  async handleWebhook(providerType: VirtualAccountProviderType, rawBody: string | Buffer, headers: Record<string, string>): Promise<unknown> {
    const provider = this.providerFactory.getProvider(providerType);

    if (!provider.verifyWebhookSignature(rawBody, headers)) {
      throw new BusinessException('Webhook signature verification failed');
    }

    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString());

    // Handle DVA assignment webhook (async response to /assign endpoint)
    if (payload.event === 'dedicatedaccount.assign.success') {
      return this.handleDvaAssigned(payload);
    }
    if (payload.event === 'dedicatedaccount.assign.failed') {
      this.logger.error(`DVA assignment failed: ${JSON.stringify(payload.data)}`);
      return { ignored: true };
    }

    const parsed = provider.parseWebhookPayload(payload);
    if (!parsed) {
      this.logger.log(`Ignoring non-reconcilable ${providerType} webhook event: ${payload.event}`);
      return { ignored: true };
    }

    return this.reconcile(providerType, parsed);
  }

  private async handleDvaAssigned(payload: {
    data?: {
      account_number?: string;
      account_name?: string;
      customer?: { customer_code?: string; email?: string };
      bank?: { name?: string };
    };
  }): Promise<unknown> {
    const data = payload.data;
    if (!data?.account_number || !data.customer?.customer_code) {
      this.logger.warn('dedicatedaccount.assign.success missing account_number or customer_code');
      return { ignored: true };
    }
    // Find the PENDING virtual account for this Paystack customer
    const pending = await this.prisma.virtualAccount.findFirst({
      where: { providerCustomerId: { startsWith: 'PENDING-' } },
      orderBy: { createdAt: 'desc' },
    });
    if (!pending) {
      this.logger.warn(`No PENDING virtual account found to update with ${data.account_number}`);
      return { ignored: true };
    }
    const updated = await this.prisma.virtualAccount.update({
      where: { id: pending.id },
      data: {
        providerCustomerId: data.customer.customer_code,
        accountNumber:      data.account_number,
        accountName:        data.account_name ?? pending.accountName,
        bankName:           data.bank?.name ?? pending.bankName,
      },
    });
    this.logger.log(`Updated PENDING virtual account ${pending.id} → ${data.account_number}`);
    this.events.emit('audit.log', {
      action: AuditAction.UPDATE,
      module: 'virtual-accounts',
      entityId: updated.id,
      entityType: 'VirtualAccount',
      description: `DVA assigned by Paystack: ${data.account_number}`,
      isSuccess: true,
    });
    return updated;
  }

  /** Dev-only helper — exercises the exact same reconciliation path a real webhook would, without needing a real bank. Only works when LOCAL is the active provider. */
  async simulatePayment(virtualAccountId: string, dto: SimulatePaymentDto): Promise<unknown> {
    const account = await this.prisma.virtualAccount.findUnique({ where: { id: virtualAccountId } });
    if (!account) throw new ResourceNotFoundException('Virtual account', virtualAccountId);

    // Allow simulation for LOCAL provider and PAYSTACK test mode
    const isTestMode = account.provider === 'LOCAL' ||
      (account.provider === 'PAYSTACK' && (this.config.get<string>('PAYSTACK_SECRET_KEY') ?? '').startsWith('sk_test_'));

    if (!isTestMode) {
      throw new BusinessException('simulatePayment only works for LOCAL provider or Paystack test mode');
    }

    return this.reconcile(account.provider, {
      providerReference: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      accountNumber: account.accountNumber,
      amount: dto.amount,
      currency: 'NGN',
      payerName: dto.payerName,
      narration: dto.narration,
      receivedAt: new Date(),
    });
  }

  private async reconcile(
    providerType: VirtualAccountProviderType,
    parsed: { providerReference: string; accountNumber: string; amount: number; currency?: string; payerName?: string; payerAccountNumber?: string; narration?: string; receivedAt: Date },
  ): Promise<unknown> {
    // Idempotency: the same webhook can be redelivered by the provider — providerReference is unique, so a duplicate just returns the original record.
    const existingTx = await this.prisma.virtualAccountTransaction.findUnique({ where: { providerReference: parsed.providerReference } });
    if (existingTx) return existingTx;

    const account = await this.prisma.virtualAccount.findUnique({ where: { accountNumber: parsed.accountNumber } });

    const transaction = await this.prisma.virtualAccountTransaction.create({
      data: {
        virtualAccountId: account?.id,
        targetAccountNumber: parsed.accountNumber,
        provider: providerType,
        providerReference: parsed.providerReference,
        amount: parsed.amount,
        currency: parsed.currency ?? 'NGN',
        payerName: parsed.payerName,
        payerAccountNumber: parsed.payerAccountNumber,
        narration: parsed.narration,
        receivedAt: parsed.receivedAt,
        status: account ? VirtualAccountTransactionStatus.MATCHED : VirtualAccountTransactionStatus.UNMATCHED,
      },
    });

    if (!account) {
      this.logger.warn(`Unmatched payment: no virtual account found for account number ${parsed.accountNumber} — left in reconciliation queue`);
      this.events.emit('repayment.unmatched', { transactionId: transaction.id, accountNumber: parsed.accountNumber, amount: parsed.amount });
      return transaction;
    }

    const result = await this.loanApplicationsService.applyRepayment(
      account.loanId,
      parsed.amount,
      providerType,
      parsed.providerReference,
      parsed.narration,
    );

    await this.prisma.virtualAccountTransaction.update({
      where: { id: transaction.id },
      data: { status: VirtualAccountTransactionStatus.RECONCILED, repaymentTransactionId: result.transactionId },
    });

    this.events.emit('audit.log', {
      action: AuditAction.CREATE,
      module: 'virtual-accounts',
      entityId: transaction.id,
      entityType: 'VirtualAccountTransaction',
      description: `Reconciled ${parsed.amount} payment on ${account.accountNumber} against loan ${result.loan.loanNumber}`,
      isSuccess: true,
    });

    return transaction;
  }

  /** Payments that arrived for an account number that doesn't match any VirtualAccount — Accounting resolves these manually. */
  async findUnmatched(): Promise<unknown[]> {
    return this.prisma.virtualAccountTransaction.findMany({
      where: { status: VirtualAccountTransactionStatus.UNMATCHED },
      orderBy: { receivedAt: 'desc' },
    });
  }

  /** Manually links an unmatched transaction to a virtual account and runs it through the same reconciliation logic — Accounting's resolution action. */
  async resolveUnmatched(transactionId: string, virtualAccountId: string): Promise<unknown> {
    const transaction = await this.prisma.virtualAccountTransaction.findUnique({ where: { id: transactionId } });
    if (!transaction) throw new ResourceNotFoundException('Virtual account transaction', transactionId);
    if (transaction.status !== VirtualAccountTransactionStatus.UNMATCHED) {
      throw new BusinessException(`Transaction is already ${transaction.status}`);
    }

    const account = await this.prisma.virtualAccount.findUnique({ where: { id: virtualAccountId } });
    if (!account) throw new ResourceNotFoundException('Virtual account', virtualAccountId);

    const result = await this.loanApplicationsService.applyRepayment(
      account.loanId,
      Number(transaction.amount),
      transaction.provider,
      transaction.providerReference,
      `Manually reconciled: ${transaction.narration ?? ''}`,
    );

    await this.prisma.virtualAccountTransaction.update({
      where: { id: transactionId },
      data: { virtualAccountId, status: VirtualAccountTransactionStatus.RECONCILED, repaymentTransactionId: result.transactionId },
    });

    this.events.emit('audit.log', {
      action: AuditAction.UPDATE,
      module: 'virtual-accounts',
      entityId: transactionId,
      entityType: 'VirtualAccountTransaction',
      description: `Manually reconciled unmatched payment against loan ${result.loan.loanNumber}`,
      isSuccess: true,
    });

    return this.prisma.virtualAccountTransaction.findUnique({ where: { id: transactionId } });
  }
}
