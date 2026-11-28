import { Injectable, Logger, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaystackService } from '../paystack/paystack.service';
import {
  DisbursementEntityType,
  DisbursementRecipientType,
  DisbursementStatus,
  RecipientOwnerType,
} from '@prisma/client';

export interface InitiateDisbursementDto {
  entityType: DisbursementEntityType;
  entityId: string;
  recipientType: DisbursementRecipientType;
  recipientId: string;
  amount: number;
  purpose: string;
  initiatedById?: string;
  metadata?: any;
}

@Injectable()
export class DisbursementService {
  private readonly logger = new Logger(DisbursementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
  ) {}

  /**
   * Main entry point: Initiate disbursement for ANY entity type
   */
  async initiateDisbursement(dto: InitiateDisbursementDto) {
    this.logger.log(
      `Initiating disbursement: ${dto.entityType} ${dto.entityId} -> ${dto.recipientType} ${dto.recipientId}`,
    );

    // Get recipient bank details
    const recipientDetails = await this.getRecipientBankDetails(
      dto.recipientType,
      dto.recipientId,
    );

    if (!recipientDetails.accountNumber || !recipientDetails.bankCode) {
      throw new HttpException(
        `${dto.recipientType} bank details are not complete. Please update bank information.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create disbursement transaction record
    const transaction = await this.prisma.disbursementTransaction.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        recipientType: dto.recipientType,
        recipientId: dto.recipientId,
        recipientName: recipientDetails.name,
        amount: dto.amount,
        purpose: dto.purpose,
        accountNumber: recipientDetails.accountNumber,
        accountName: recipientDetails.accountName,
        bankCode: recipientDetails.bankCode,
        bankName: recipientDetails.bankName,
        status: DisbursementStatus.PENDING,
        initiatedById: dto.initiatedById,
        metadata: dto.metadata,
      },
    });

    this.logger.log(`Created disbursement transaction: ${transaction.id}`);

    // Try to process immediately
    try {
      await this.processDisbursement(transaction.id);
    } catch (error) {
      this.logger.error(
        `Failed to process disbursement ${transaction.id} immediately`,
        error,
      );
      // Don't throw - transaction is recorded and can be retried
    }

    return transaction;
  }

  /**
   * Process a disbursement (create recipient + initiate transfer)
   */
  async processDisbursement(disbursementId: string) {
    const transaction = await this.prisma.disbursementTransaction.findUnique({
      where: { id: disbursementId },
    });

    if (!transaction) {
      throw new NotFoundException('Disbursement transaction not found');
    }

    if (transaction.status === DisbursementStatus.SUCCESS) {
      this.logger.warn(`Disbursement ${disbursementId} is already successful`);
      return transaction;
    }

    try {
      // Update status to PROCESSING
      await this.prisma.disbursementTransaction.update({
        where: { id: disbursementId },
        data: { status: DisbursementStatus.PROCESSING },
      });

      // Get or create Paystack recipient
      const recipientCode = await this.getOrCreatePaystackRecipient(
        transaction.recipientType as RecipientOwnerType,
        transaction.recipientId,
        {
          accountNumber: transaction.accountNumber!,
          accountName: transaction.accountName!,
          bankCode: transaction.bankCode!,
          bankName: transaction.bankName,
        },
      );

      // Generate unique reference
      const reference = `${transaction.entityType.toLowerCase()}_${transaction.entityId}_${Date.now()}`;

      // Initiate transfer
      const transfer = await this.paystackService.initiateTransfer({
        source: 'balance',
        amount: this.paystackService.nairaToKobo(Number(transaction.amount)),
        recipient: recipientCode,
        reason: transaction.purpose || `Disbursement for ${transaction.entityType}`,
        reference,
      });

      // Update transaction with Paystack details
      const updated = await this.prisma.disbursementTransaction.update({
        where: { id: disbursementId },
        data: {
          paystackTransferCode: transfer.transfer_code,
          paystackRecipientCode: recipientCode,
          paystackReference: transfer.reference,
          paystackStatus: transfer.status,
          status: this.mapPaystackStatusToDisbursementStatus(transfer.status),
        },
      });

      this.logger.log(
        `Disbursement ${disbursementId} processed: ${transfer.transfer_code}`,
      );

      return updated;
    } catch (error) {
      this.logger.error(`Failed to process disbursement ${disbursementId}`, error);

      // Update with failure
      await this.prisma.disbursementTransaction.update({
        where: { id: disbursementId },
        data: {
          status: DisbursementStatus.FAILED,
          failureReason: (error as any).message || 'Unknown error',
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Get or create Paystack transfer recipient
   */
  private async getOrCreatePaystackRecipient(
    ownerType: RecipientOwnerType,
    ownerId: string,
    bankDetails: {
      accountNumber: string;
      accountName: string;
      bankCode: string;
      bankName?: string | null;
    },
  ): Promise<string> {
    // Check if recipient already exists
    const existing = await this.prisma.paystackTransferRecipient.findUnique({
      where: {
        ownerType_ownerId: {
          ownerType,
          ownerId,
        },
      },
    });

    if (existing && existing.isActive) {
      this.logger.debug(`Using existing recipient: ${existing.recipientCode}`);
      return existing.recipientCode;
    }

    // Verify account first
    const verified = await this.paystackService.verifyAccount(
      bankDetails.accountNumber,
      bankDetails.bankCode,
    );

    // Create new recipient on Paystack
    const recipient = await this.paystackService.createRecipient({
      type: 'nuban',
      name: verified.account_name,
      account_number: bankDetails.accountNumber,
      bank_code: bankDetails.bankCode,
      currency: 'NGN',
      description: `${ownerType} - ${ownerId}`,
    });

    // Save to database
    const saved = await this.prisma.paystackTransferRecipient.upsert({
      where: {
        ownerType_ownerId: {
          ownerType,
          ownerId,
        },
      },
      create: {
        ownerType,
        ownerId,
        recipientCode: recipient.recipient_code,
        accountNumber: bankDetails.accountNumber,
        accountName: verified.account_name,
        bankCode: bankDetails.bankCode,
        bankName: bankDetails.bankName,
        isActive: true,
      },
      update: {
        recipientCode: recipient.recipient_code,
        accountNumber: bankDetails.accountNumber,
        accountName: verified.account_name,
        bankCode: bankDetails.bankCode,
        bankName: bankDetails.bankName,
        isActive: true,
      },
    });

    this.logger.log(`Created recipient: ${saved.recipientCode}`);
    return saved.recipientCode;
  }

  /**
   * Get recipient bank details based on type
   */
  private async getRecipientBankDetails(
    recipientType: DisbursementRecipientType,
    recipientId: string,
  ): Promise<{
    name: string;
    accountNumber: string | null;
    accountName: string | null;
    bankCode: string | null;
    bankName: string | null;
  }> {
    if (recipientType === DisbursementRecipientType.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: recipientId },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      return {
        name: `${customer.firstName} ${customer.lastName}`,
        accountNumber: customer.bankAccountNumber,
        accountName: customer.bankAccountNumber, // Will be verified
        bankCode: customer.bankCode,
        bankName: null,
      };
    }

    if (recipientType === DisbursementRecipientType.EMPLOYEE) {
      const user = await this.prisma.user.findUnique({
        where: { id: recipientId },
      });

      if (!user) {
        throw new NotFoundException('Employee not found');
      }

      return {
        name: `${user.firstName} ${user.lastName}`,
        accountNumber: user.bankAccountNumber,
        accountName: user.bankAccountNumber, // Will be verified
        bankCode: user.bankCode,
        bankName: user.bankName,
      };
    }

    throw new HttpException(
      `Recipient type ${recipientType} not yet implemented`,
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  /**
   * Handle webhook event from Paystack
   */
  async handleWebhookEvent(event: any) {
    this.logger.log(`Processing webhook event: ${event.event}`);

    if (event.event === 'transfer.success' || event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
      const reference = event.data.reference;

      const transaction = await this.prisma.disbursementTransaction.findUnique({
        where: { paystackReference: reference },
      });

      if (!transaction) {
        this.logger.warn(`No transaction found for reference: ${reference}`);
        return;
      }

      const newStatus = this.mapPaystackStatusToDisbursementStatus(event.data.status);

      await this.prisma.disbursementTransaction.update({
        where: { id: transaction.id },
        data: {
          status: newStatus,
          paystackStatus: event.data.status,
          completedAt: newStatus === DisbursementStatus.SUCCESS ? new Date() : transaction.completedAt,
          failureReason: event.data.status === 'failed' ? event.data.reason : transaction.failureReason,
        },
      });

      this.logger.log(
        `Updated transaction ${transaction.id} to ${newStatus}`,
      );

      // Update related entity status
      await this.updateEntityDisbursementStatus(
        transaction.entityType,
        transaction.entityId,
        transaction.id,
        newStatus,
      );
    }
  }

  /**
   * Update entity (loan, transport, etc.) disbursement status
   */
  private async updateEntityDisbursementStatus(
    entityType: DisbursementEntityType,
    entityId: string,
    transactionId: string,
    status: DisbursementStatus,
  ) {
    if (entityType === DisbursementEntityType.LOAN) {
      await this.prisma.loanApplication.update({
        where: { id: entityId },
        data: {
          disbursementTransactionId: transactionId,
          disbursementStatus: status,
        },
      });
    }

    if (entityType === DisbursementEntityType.TRANSPORT) {
      await this.prisma.transportRequest.update({
        where: { id: entityId },
        data: {
          disbursementTransactionId: transactionId,
          reimbursementStatus: status,
        },
      });
    }

    // Add more entity types as needed
  }

  /**
   * Retry failed disbursement
   */
  async retryDisbursement(disbursementId: string) {
    const transaction = await this.prisma.disbursementTransaction.findUnique({
      where: { id: disbursementId },
    });

    if (!transaction) {
      throw new NotFoundException('Disbursement not found');
    }

    if (transaction.status === DisbursementStatus.SUCCESS) {
      throw new HttpException(
        'Cannot retry successful disbursement',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(`Retrying disbursement ${disbursementId}`);
    return this.processDisbursement(disbursementId);
  }

  /**
   * Get pending disbursements
   */
  async getPendingDisbursements(entityType?: DisbursementEntityType) {
    return this.prisma.disbursementTransaction.findMany({
      where: {
        status: { in: [DisbursementStatus.PENDING, DisbursementStatus.PROCESSING] },
        entityType,
      },
      orderBy: { initiatedAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Get failed disbursements
   */
  async getFailedDisbursements(entityType?: DisbursementEntityType) {
    return this.prisma.disbursementTransaction.findMany({
      where: {
        status: DisbursementStatus.FAILED,
        entityType,
      },
      orderBy: { initiatedAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Get disbursement by ID
   */
  async getDisbursement(id: string) {
    const transaction = await this.prisma.disbursementTransaction.findUnique({
      where: { id },
      include: {
        initiatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Disbursement not found');
    }

    return transaction;
  }

  /**
   * Get disbursements for specific entity
   */
  async getDisbursementsForEntity(entityType: DisbursementEntityType, entityId: string) {
    return this.prisma.disbursementTransaction.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { initiatedAt: 'desc' },
    });
  }

  /**
   * Map Paystack status to our DisbursementStatus
   */
  private mapPaystackStatusToDisbursementStatus(
    paystackStatus: string,
  ): DisbursementStatus {
    switch (paystackStatus) {
      case 'pending':
      case 'otp':
      case 'queued':
        return DisbursementStatus.PROCESSING;
      case 'success':
        return DisbursementStatus.SUCCESS;
      case 'failed':
        return DisbursementStatus.FAILED;
      case 'reversed':
        return DisbursementStatus.REVERSED;
      default:
        return DisbursementStatus.PENDING;
    }
  }
}
