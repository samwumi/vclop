import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record staff loan payment (immutable)
   */
  async recordPayment(data: {
    loanId: string;
    installmentId: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
    referenceNumber?: string;
    recordedById: string;
    notes?: string;
  }) {
    return await this.prisma.$transaction(async (tx) => {
      const installment = await tx.staffLoanInstallment.findUnique({
        where: { id: data.installmentId },
        include: { staffLoan: true },
      });

      if (!installment) {
        throw new NotFoundException('Installment not found');
      }

      if (installment.staffLoanId !== data.loanId) {
        throw new BadRequestException('Installment does not belong to this loan');
      }

      // Calculate payment allocation
      const principalDue = Number(installment.principalDue);
      const interestDue = Number(installment.interestDue);
      const totalDue = Number(installment.totalDue);

      // Get existing payments for this installment
      const existingPayments = await tx.staffLoanPayment.findMany({
        where: {
          installmentId: data.installmentId,
          isReversed: false,
          isVerified: true,
        },
      });

      const alreadyPaid = existingPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const remaining = totalDue - alreadyPaid;

      if (data.amount <= 0) {
        throw new BadRequestException('Payment amount must be positive');
      }

      // Calculate allocation (pay interest first, then principal)
      const interestPortion = Math.min(data.amount, interestDue);
      const principalPortion = Math.max(0, data.amount - interestPortion);

      // Generate payment number
      const paymentNumber = await this.generatePaymentNumber();

      // Create immutable payment record
      const payment = await tx.staffLoanPayment.create({
        data: {
          paymentNumber,
          staffLoanId: data.loanId,
          installmentId: data.installmentId,
          amount: data.amount,
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod as any,
          principalPaid: principalPortion,
          interestPaid: interestPortion,
          transactionReference: data.referenceNumber,
          notes: data.notes,
          recordedById: data.recordedById,
          isVerified: false,
        },
      });

      // Update installment status
      const newAmountPaid = alreadyPaid + data.amount;
      const newStatus =
        newAmountPaid >= totalDue
          ? 'PAID'
          : newAmountPaid > 0
          ? 'PARTIALLY_PAID'
          : installment.status;

      await tx.staffLoanInstallment.update({
        where: { id: data.installmentId },
        data: {
          status: newStatus,
        },
      });

      return payment;
    });
  }

  private async generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.staffLoanPayment.count({
      where: {
        paymentNumber: { startsWith: `SLPAY${year}` },
      },
    });
    return `SLPAY${year}${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Reverse payment (creates separate reversal record)
   */
  async reversePayment(
    paymentId: string,
    reversedById: string,
    reason: string,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const payment = await tx.staffLoanPayment.findUnique({
        where: { id: paymentId },
        include: { installment: true },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.isReversed) {
        throw new BadRequestException('Payment already reversed');
      }

      // Generate reversal number
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.staffLoanReversal.count();
      const reversalNumber = `REV${today}${String(count + 1).padStart(4, '0')}`;

      // Create reversal record
      const reversal = await tx.staffLoanReversal.create({
        data: {
          reversalNumber,
          staffLoanId: payment.staffLoanId,
          originalPaymentId: paymentId,
          reversalAmount: payment.amount,
          reversalDate: new Date(),
          reason,
          reasonCategory: 'ADMINISTRATIVE_ERROR' as any,
          approvedById: reversedById,
        },
      });

      // Mark payment as reversed
      await tx.staffLoanPayment.update({
        where: { id: paymentId },
        data: { isReversed: true, reversalId: reversal.id },
      });

      // Note: Installment paid amounts are calculated from payments relation,
      // so no need to manually update installment fields

      // Reopen loan if it was fully paid
      await tx.staffLoan.updateMany({
        where: {
          id: payment.staffLoanId,
          status: 'FULLY_PAID' as any,
        },
        data: {
          status: 'ACTIVE' as any,
        },
      });

      return reversal;
    });
  }

  /**
   * Get payment history for a loan
   */
  async getPaymentHistory(loanId: string) {
    return await this.prisma.staffLoanPayment.findMany({
      where: { staffLoanId: loanId },
      include: {
        installment: true,
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reversal: {
          include: {
            approvedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }
}
