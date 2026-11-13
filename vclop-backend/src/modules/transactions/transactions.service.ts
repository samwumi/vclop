import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TransactionQueryDto, TransactionType, TransactionStatus } from './dto/transaction-query.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyTransactions(query: TransactionQueryDto) {
    const { startDate, endDate, type, status, search } = query;

    // Default to today if no date range provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));

    // Fetch Virtual Account Transactions
    const vaTransactions = (type === TransactionType.ALL || type === TransactionType.VIRTUAL_ACCOUNT
      ? await this.prisma.virtualAccountTransaction.findMany({
          where: {
            receivedAt: { gte: start, lte: end },
            ...(status !== TransactionStatus.ALL && { status: status as any }),
            ...(search && {
              OR: [
                { payerName: { contains: search } },
                { targetAccountNumber: { contains: search } },
                { providerReference: { contains: search } },
              ],
            }),
          },
          include: {
            virtualAccount: {
              include: {
                loan: {
                  include: {
                    loanApplication: {
                      include: {
                        customer: {
                          select: {
                            id: true,
                            customerNumber: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { receivedAt: 'desc' },
        })
      : []) as Array<any>;

    // Fetch Manual Repayment Transactions
    const manualTransactions = (type === TransactionType.ALL || type === TransactionType.MANUAL
      ? await this.prisma.repaymentTransaction.findMany({
          where: {
            createdAt: { gte: start, lte: end },
            ...(search && {
              OR: [
                { receiptNumber: { contains: search } },
                { reference: { contains: search } },
              ],
            }),
          },
          include: {
            loan: {
              include: {
                loanApplication: {
                  include: {
                    customer: {
                      select: {
                        id: true,
                        customerNumber: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      : []) as Array<any>;

    // Combine and format transactions
    const combinedTransactions = [
      ...vaTransactions.map((t) => ({
        id: t.id,
        type: 'VIRTUAL_ACCOUNT' as const,
        amount: Number(t.amount),
        date: t.receivedAt,
        status: t.status,
        reference: t.providerReference,
        payerName: t.payerName,
        accountNumber: t.targetAccountNumber,
        provider: t.provider,
        customer: t.virtualAccount?.loan?.loanApplication?.customer
          ? {
              id: t.virtualAccount.loan.loanApplication.customer.id,
              customerNumber: t.virtualAccount.loan.loanApplication.customer.customerNumber,
              name: `${t.virtualAccount.loan.loanApplication.customer.firstName} ${t.virtualAccount.loan.loanApplication.customer.lastName}`,
              phone: t.virtualAccount.loan.loanApplication.customer.phone,
            }
          : null,
        loan: t.virtualAccount?.loan
          ? {
              id: t.virtualAccount.loan.id,
              loanNumber: t.virtualAccount.loan.loanNumber,
            }
          : null,
      })),
      ...manualTransactions.map((t) => ({
        id: t.id,
        type: 'MANUAL' as const,
        amount: Number(t.amount),
        date: t.createdAt,
        status: 'MATCHED' as const, // Manual transactions are always matched
        reference: t.receiptNumber || t.reference || '—',
        payerName: t.loan?.loanApplication?.customer
          ? `${t.loan.loanApplication.customer.firstName} ${t.loan.loanApplication.customer.lastName}`
          : null,
        accountNumber: '—',
        method: t.method,
        notes: t.notes,
        customer: t.loan?.loanApplication?.customer
          ? {
              id: t.loan.loanApplication.customer.id,
              customerNumber: t.loan.loanApplication.customer.customerNumber,
              name: `${t.loan.loanApplication.customer.firstName} ${t.loan.loanApplication.customer.lastName}`,
              phone: t.loan.loanApplication.customer.phone,
            }
          : null,
        loan: t.loan
          ? {
              id: t.loan.id,
              loanNumber: t.loan.loanNumber,
            }
          : null,
      })),
    ];

    // Sort by date descending
    combinedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Calculate summary
    const summary = {
      totalAmount: combinedTransactions.reduce((sum, t) => sum + t.amount, 0),
      totalCount: combinedTransactions.length,
      vaCount: vaTransactions.length,
      vaAmount: vaTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
      manualCount: manualTransactions.length,
      manualAmount: manualTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
      matchedCount: combinedTransactions.filter((t) => t.status === 'MATCHED').length,
      unmatchedCount: combinedTransactions.filter((t) => t.status === 'UNMATCHED').length,
    };

    return {
      transactions: combinedTransactions,
      summary,
      dateRange: {
        start,
        end,
      },
    };
  }

  async getTransactionStats(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate.setHours(0, 0, 0, 0));
    const end = new Date(targetDate.setHours(23, 59, 59, 999));

    const [vaCount, vaSum, manualCount, manualSum] = await Promise.all([
      this.prisma.virtualAccountTransaction.count({
        where: { receivedAt: { gte: start, lte: end } },
      }),
      this.prisma.virtualAccountTransaction.aggregate({
        where: { receivedAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.repaymentTransaction.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.repaymentTransaction.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ]);

    return {
      date: targetDate,
      vaTransactions: {
        count: vaCount,
        amount: Number(vaSum._sum.amount || 0),
      },
      manualTransactions: {
        count: manualCount,
        amount: Number(manualSum._sum.amount || 0),
      },
      total: {
        count: vaCount + manualCount,
        amount: Number(vaSum._sum.amount || 0) + Number(manualSum._sum.amount || 0),
      },
    };
  }
}
