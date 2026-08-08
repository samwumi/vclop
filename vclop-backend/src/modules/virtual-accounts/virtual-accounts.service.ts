import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
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

  async createForLoanApplication(loanApplicationId: string): Promise<unknown> {
    // Find the loan by application ID
    const loan = await this.prisma.loan.findFirst({
      where: { loanApplicationId },
      include: { loanApplication: { select: { customerId: true } } },
    });
    if (!loan) throw new ResourceNotFoundException('Loan for application', loanApplicationId);
    return this.createForLoan(loan.id, loan.loanApplication.customerId);
  }

  async createForLoan(loanId: string, customerId: string): Promise<unknown> {
    const existing = await this.prisma.virtualAccount.findUnique({ where: { loanId } });
    if (existing) return existing;

    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new ResourceNotFoundException('Customer', customerId);

    const provider = this.providerFactory.getActiveProvider();
    const result = await provider.createVirtualAccount({
      loanId,
      customerId,
      customerName: customer.businessName ?? `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email ?? undefined,
      customerPhone: customer.phone,
      customerBvn: customer.bvn ?? undefined,
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
    const parsed = provider.parseWebhookPayload(payload);

    // Not every event this provider sends is a reconcilable account credit
    // (e.g. Paystack also sends charge.success for card payments) — those
    // are acknowledged and ignored, not treated as an error, so the
    // provider doesn't keep retrying delivery.
    if (!parsed) {
      this.logger.log(`Ignoring non-reconcilable ${providerType} webhook event`);
      return { ignored: true };
    }

    return this.reconcile(providerType, parsed);
  }

  /** Dev-only helper — exercises the exact same reconciliation path a real webhook would, without needing a real bank. Only works when LOCAL is the active provider. */
  async simulatePayment(virtualAccountId: string, dto: SimulatePaymentDto): Promise<unknown> {
    const account = await this.prisma.virtualAccount.findUnique({ where: { id: virtualAccountId } });
    if (!account) throw new ResourceNotFoundException('Virtual account', virtualAccountId);
    if (account.provider !== 'LOCAL') {
      throw new BusinessException('simulatePayment only works for accounts on the LOCAL provider');
    }

    return this.reconcile('LOCAL', {
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
