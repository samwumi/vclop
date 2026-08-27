import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanApplicationStatus, VirtualAccountTransactionStatus, InstallmentStatus } from '@prisma/client';
import dayjs from 'dayjs';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get daily reconciliation summary:
   * - Total disbursed (loans disbursed on this date)
   * - Total repayments received (actual payments on this date)
   * - Expected repayments (repayment schedules due on this date)
   * - Overdue amount
   * - Number of discrepancies
   * - Overall status (BALANCED, DISCREPANCY, PENDING)
   */
  async getSummary(dateStr?: string) {
    const date = dateStr ? dayjs(dateStr) : dayjs();
    const startOfDay = date.startOf('day').toDate();
    const endOfDay = date.endOf('day').toDate();

    // Total disbursed on this date (loans table has disbursedAt)
    const disbursedResult = await this.prisma.loan.aggregate({
      where: {
        disbursedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: { principal: true },
    });
    const totalDisbursed = Number(disbursedResult._sum?.principal || 0);

    // Total repayments received on this date
    const repaymentsResult = await this.prisma.virtualAccountTransaction.aggregate({
      where: {
        status: VirtualAccountTransactionStatus.RECONCILED,
        receivedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: { amount: true },
    });
    const totalRepayments = Number(repaymentsResult._sum.amount || 0);

    // Expected repayments due on this date (from repayment installments)
    const expectedResult = await this.prisma.repaymentInstallment.aggregate({
      where: {
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: InstallmentStatus.PAID },
      },
      _sum: { totalDue: true },
    });
    const expectedRepayments = Number(expectedResult._sum?.totalDue || 0);

    // Overdue amount (past due date and not fully paid)
    const overdueResult = await this.prisma.repaymentInstallment.aggregate({
      where: {
        dueDate: { lt: startOfDay },
        status: { notIn: [InstallmentStatus.PAID] },
      },
      _sum: { totalDue: true },
    });
    const overdueAmount = Number(overdueResult._sum?.totalDue || 0);

    // Count discrepancies (unmatched transactions on this date)
    const discrepancyCount = await this.prisma.virtualAccountTransaction.count({
      where: {
        status: VirtualAccountTransactionStatus.UNMATCHED,
        receivedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Determine overall status
    let status: 'BALANCED' | 'DISCREPANCY' | 'PENDING';
    if (discrepancyCount > 0) {
      status = 'DISCREPANCY';
    } else if (Math.abs(totalRepayments - expectedRepayments) < 100) {
      // Within ₦100 tolerance
      status = 'BALANCED';
    } else {
      status = 'PENDING';
    }

    return {
      date: date.format('YYYY-MM-DD'),
      totalDisbursed,
      totalRepayments,
      expectedRepayments,
      overdueAmount,
      discrepancies: discrepancyCount,
      status,
    };
  }

  /**
   * Get list of payment discrepancies:
   * - Missing payments (expected but not received)
   * - Unmatched payments (received but not linked to a loan)
   * - Amount mismatches (payment amount differs from expected)
   */
  async getDiscrepancies(dateStr?: string) {
    const date = dateStr ? dayjs(dateStr) : dayjs();
    const startOfDay = date.startOf('day').toDate();
    const endOfDay = date.endOf('day').toDate();

    const discrepancies = [];

    // 1. Missing payments (installments due but not paid)
    const missingPayments = await this.prisma.repaymentInstallment.findMany({
      where: {
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: [InstallmentStatus.PENDING, InstallmentStatus.OVERDUE, InstallmentStatus.PARTIALLY_PAID] },
      },
      include: {
        loan: {
          include: {
            loanApplication: {
              include: {
                customer: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 100,
    });

    for (const installment of missingPayments) {
      const expectedAmount = Number(installment.totalDue);
      const paidAmount = Number(installment.amountPaid || 0);
      const difference = expectedAmount - paidAmount;

      if (difference > 0) {
        discrepancies.push({
          id: installment.id,
          type: 'MISSING_PAYMENT',
          loanNumber: installment.loan.loanNumber,
          customerName: `${installment.loan.loanApplication.customer.firstName} ${installment.loan.loanApplication.customer.lastName}`,
          expectedAmount,
          actualAmount: paidAmount,
          difference,
          paymentDate: installment.dueDate.toISOString(),
          description: `Payment of ₦${expectedAmount.toLocaleString()} was due but ${paidAmount > 0 ? 'only ₦' + paidAmount.toLocaleString() + ' received' : 'not received'}`,
          severity: difference > 50000 ? 'HIGH' : difference > 10000 ? 'MEDIUM' : 'LOW',
        });
      }
    }

    // 2. Unmatched payments (transactions that couldn't be linked)
    const unmatchedPayments = await this.prisma.virtualAccountTransaction.findMany({
      where: {
        status: VirtualAccountTransactionStatus.UNMATCHED,
        receivedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      take: 100,
    });

    for (const txn of unmatchedPayments) {
      discrepancies.push({
        id: txn.id,
        type: 'UNMATCHED_PAYMENT',
        expectedAmount: 0,
        actualAmount: Number(txn.amount),
        difference: Number(txn.amount),
        paymentDate: txn.receivedAt.toISOString(),
        description: `Payment of ₦${Number(txn.amount).toLocaleString()} received but could not be matched to any loan (Ref: ${txn.providerReference})`,
        severity: Number(txn.amount) > 50000 ? 'HIGH' : 'MEDIUM',
      });
    }

    // Sort by severity and amount
    type Severity = 'HIGH' | 'MEDIUM' | 'LOW';
    discrepancies.sort((a, b) => {
      const severityOrder: Record<Severity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      if (severityOrder[a.severity as Severity] !== severityOrder[b.severity as Severity]) {
        return severityOrder[a.severity as Severity] - severityOrder[b.severity as Severity];
      }
      return b.difference - a.difference;
    });

    return discrepancies;
  }

  /**
   * Get unmatched Paystack/bank transactions that need manual reconciliation
   */
  async getUnmatched(dateStr?: string) {
    const date = dateStr ? dayjs(dateStr) : dayjs();
    const startOfDay = date.startOf('day').toDate();
    const endOfDay = date.endOf('day').toDate();

    const transactions = await this.prisma.virtualAccountTransaction.findMany({
      where: {
        status: VirtualAccountTransactionStatus.UNMATCHED,
        receivedAt: dateStr
          ? {
              gte: startOfDay,
              lte: endOfDay,
            }
          : undefined, // If no date specified, show all unmatched
      },
      orderBy: { receivedAt: 'desc' },
      take: 100,
    });

    return transactions.map((txn) => ({
      reference: txn.providerReference,
      amount: Number(txn.amount),
      customerName: txn.payerName || 'Unknown',
      accountNumber: txn.payerAccountNumber || 'N/A',
      date: txn.receivedAt.toISOString(),
      matched: false,
      transactionId: txn.id,
    }));
  }
}
