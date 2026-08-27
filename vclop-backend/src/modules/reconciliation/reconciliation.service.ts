import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VirtualAccountTransactionStatus, InstallmentStatus } from '@prisma/client';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get reconciliation summary with optional date range and grouping:
   * - Total disbursed (loans disbursed in range)
   * - Total repayments received (actual payments in range)
   * - Expected repayments (repayment schedules due in range)
   * - Overdue amount
   * - Number of discrepancies
   * - Overall status (BALANCED, DISCREPANCY, PENDING)
   * 
   * Supports grouping by day, week, or month for trend analysis
   */
  async getSummary(startDateStr?: string, endDateStr?: string, groupBy?: 'day' | 'week' | 'month') {
    // Default to today if no dates provided
    const startDate = startDateStr ? dayjs(startDateStr) : dayjs().startOf('day');
    const endDate = endDateStr ? dayjs(endDateStr) : (startDateStr ? dayjs(startDateStr).endOf('day') : dayjs().endOf('day'));
    
    const startOfRange = startDate.startOf('day').toDate();
    const endOfRange = endDate.endOf('day').toDate();

    // If grouping is requested, return grouped data
    if (groupBy) {
      return this.getGroupedSummary(startOfRange, endOfRange, groupBy);
    }

    // Single period summary
    return this.getPeriodSummary(startOfRange, endOfRange, startDate.format('YYYY-MM-DD'));
  }

  private async getPeriodSummary(startOfRange: Date, endOfRange: Date, label: string) {
    // Total disbursed in range (loans table has disbursedAt)
    const disbursedResult = await this.prisma.loan.aggregate({
      where: {
        disbursedAt: {
          gte: startOfRange,
          lte: endOfRange,
        },
      },
      _sum: { principal: true },
    });
    const totalDisbursed = Number(disbursedResult._sum?.principal || 0);

    // Total repayments received in range
    const repaymentsResult = await this.prisma.virtualAccountTransaction.aggregate({
      where: {
        status: VirtualAccountTransactionStatus.RECONCILED,
        receivedAt: {
          gte: startOfRange,
          lte: endOfRange,
        },
      },
      _sum: { amount: true },
    });
    const totalRepayments = Number(repaymentsResult._sum?.amount || 0);

    // Expected repayments due in range (from repayment installments)
    const expectedResult = await this.prisma.repaymentInstallment.aggregate({
      where: {
        dueDate: {
          gte: startOfRange,
          lte: endOfRange,
        },
        status: { not: InstallmentStatus.PAID },
      },
      _sum: { totalDue: true },
    });
    const expectedRepayments = Number(expectedResult._sum?.totalDue || 0);

    // Overdue amount (past due date and not fully paid)
    const overdueResult = await this.prisma.repaymentInstallment.aggregate({
      where: {
        dueDate: { lt: startOfRange },
        status: { notIn: [InstallmentStatus.PAID] },
      },
      _sum: { totalDue: true },
    });
    const overdueAmount = Number(overdueResult._sum?.totalDue || 0);

    // Count discrepancies (unmatched transactions in range)
    const discrepancyCount = await this.prisma.virtualAccountTransaction.count({
      where: {
        status: VirtualAccountTransactionStatus.UNMATCHED,
        receivedAt: {
          gte: startOfRange,
          lte: endOfRange,
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
      date: label,
      totalDisbursed,
      totalRepayments,
      expectedRepayments,
      overdueAmount,
      discrepancies: discrepancyCount,
      status,
    };
  }

  /**
   * Get grouped reconciliation summaries for trend analysis
   */
  private async getGroupedSummary(startOfRange: Date, endOfRange: Date, groupBy: 'day' | 'week' | 'month') {
    const periods: Array<{ start: Date; end: Date; label: string }> = [];
    let current = dayjs(startOfRange);
    const end = dayjs(endOfRange);

    // Generate periods based on groupBy
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      let periodStart: dayjs.Dayjs;
      let periodEnd: dayjs.Dayjs;
      let label: string;

      if (groupBy === 'day') {
        periodStart = current.startOf('day');
        periodEnd = current.endOf('day');
        label = current.format('YYYY-MM-DD');
        current = current.add(1, 'day');
      } else if (groupBy === 'week') {
        periodStart = current.startOf('isoWeek');
        periodEnd = current.endOf('isoWeek');
        label = `Week of ${periodStart.format('MMM DD, YYYY')}`;
        current = current.add(1, 'week');
      } else {
        // month
        periodStart = current.startOf('month');
        periodEnd = current.endOf('month');
        label = current.format('MMMM YYYY');
        current = current.add(1, 'month');
      }

      // Don't go beyond the end date
      if (periodEnd.isAfter(end)) {
        periodEnd = end;
      }

      periods.push({
        start: periodStart.toDate(),
        end: periodEnd.toDate(),
        label,
      });
    }

    // Get summary for each period
    const summaries = await Promise.all(
      periods.map((period) => this.getPeriodSummary(period.start, period.end, period.label))
    );

    // Calculate totals across all periods
    const totals = summaries.reduce(
      (acc, s) => ({
        totalDisbursed: acc.totalDisbursed + s.totalDisbursed,
        totalRepayments: acc.totalRepayments + s.totalRepayments,
        expectedRepayments: acc.expectedRepayments + s.expectedRepayments,
        overdueAmount: acc.overdueAmount + s.overdueAmount,
        discrepancies: acc.discrepancies + s.discrepancies,
      }),
      { totalDisbursed: 0, totalRepayments: 0, expectedRepayments: 0, overdueAmount: 0, discrepancies: 0 }
    );

    return {
      startDate: dayjs(startOfRange).format('YYYY-MM-DD'),
      endDate: dayjs(endOfRange).format('YYYY-MM-DD'),
      groupBy,
      periods: summaries,
      totals: {
        ...totals,
        date: `${dayjs(startOfRange).format('MMM DD')} - ${dayjs(endOfRange).format('MMM DD, YYYY')}`,
        status: (totals.discrepancies > 0 ? 'DISCREPANCY' : Math.abs(totals.totalRepayments - totals.expectedRepayments) < 100 ? 'BALANCED' : 'PENDING') as 'BALANCED' | 'DISCREPANCY' | 'PENDING',
      },
    };
  }

  /**
   * Get list of payment discrepancies for a date range
   */
  async getDiscrepancies(startDateStr?: string, endDateStr?: string) {
    const startDate = startDateStr ? dayjs(startDateStr) : dayjs();
    const endDate = endDateStr ? dayjs(endDateStr) : (startDateStr ? dayjs(startDateStr) : dayjs());
    const startOfDay = startDate.startOf('day').toDate();
    const endOfDay = endDate.endOf('day').toDate();

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
  async getUnmatched(startDateStr?: string, endDateStr?: string) {
    const startDate = startDateStr ? dayjs(startDateStr) : dayjs();
    const endDate = endDateStr ? dayjs(endDateStr) : (startDateStr ? dayjs(startDateStr) : dayjs());
    const startOfDay = startDate.startOf('day').toDate();
    const endOfDay = endDate.endOf('day').toDate();

    const transactions = await this.prisma.virtualAccountTransaction.findMany({
      where: {
        status: VirtualAccountTransactionStatus.UNMATCHED,
        receivedAt: startDateStr
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
