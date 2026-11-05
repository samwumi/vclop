import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, PaymentStatus, PromiseStatus, RecoveryStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions/app.exceptions';
import { CreateRecoveryAccountDto } from './dto/create-recovery-account.dto';
import { UpdateRecoveryAccountDto } from './dto/update-recovery-account.dto';
import { QueryRecoveryAccountsDto } from './dto/query-recovery-accounts.dto';
import { CreateRecoveryActivityDto } from './dto/create-recovery-activity.dto';
import { CreateRecoveryPaymentDto } from './dto/create-recovery-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreateRepaymentPromiseDto } from './dto/create-repayment-promise.dto';
import { UpdatePromiseStatusDto } from './dto/update-promise-status.dto';
import { CreateRecoveryExpenseDto } from './dto/create-recovery-expense.dto';

@Injectable()
export class RecoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOVERY ACCOUNTS
  // ═══════════════════════════════════════════════════════════════════════════

  async createAccount(dto: CreateRecoveryAccountDto, createdById: string) {
    // Generate account number using a transaction to avoid race conditions
    return await this.prisma.$transaction(async (tx) => {
      // Get the highest account number to avoid duplicates
      const lastAccount = await tx.recoveryAccount.findFirst({
        orderBy: { accountNumber: 'desc' },
        select: { accountNumber: true },
      });

      let nextNumber = 1;
      if (lastAccount?.accountNumber) {
        const match = lastAccount.accountNumber.match(/REC-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      const accountNumber = `REC-${String(nextNumber).padStart(6, '0')}`;

      // Validate VCLOP loan if provided
      if (dto.vclopLoanId) {
        const loan = await tx.loan.findUnique({
          where: { id: dto.vclopLoanId },
        });
        if (!loan) {
          throw new ResourceNotFoundException('Loan', dto.vclopLoanId);
        }
      }

      // Validate customer if provided
      if (dto.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: dto.customerId },
        });
        if (!customer) {
          throw new ResourceNotFoundException('Customer', dto.customerId);
        }
      }

      const account = await tx.recoveryAccount.create({
      data: {
        accountNumber,
        ...dto,
        customerPhone: dto.customerPhone || 'N/A', // Default if not provided
        disbursementDate: new Date(dto.disbursementDate),
        createdById,
        assignedDate: dto.assignedOfficerId ? new Date() : null,
      },
      include: {
        customer: true,
        assignedOfficer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

      this.audit(createdById, AuditAction.CREATE, account.id, 'Created recovery account');

      return account;
    });
  }

  async listAccounts(query: QueryRecoveryAccountsDto, userId?: string, branchIds?: string[]) {
    const where: any = {
      deletedAt: null,
    };

    if (query.source) {
      where.source = query.source;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priorityLevel) {
      where.priorityLevel = query.priorityLevel;
    }

    if (query.assignedOfficerId) {
      where.assignedOfficerId = query.assignedOfficerId;
    }

    if (query.branchId) {
      where.branchId = query.branchId;
    }

    // Branch scoping for non-admin users
    if (branchIds?.length) {
      where.branchId = { in: branchIds };
    }

    // Search by customer name, phone, or account number
    if (query.search) {
      where.OR = [
        { customerName: { contains: query.search } },
        { customerPhone: { contains: query.search } },
        { accountNumber: { contains: query.search } },
      ];
    }

    const accounts = await this.prisma.recoveryAccount.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            customerNumber: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        assignedOfficer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          include: {
            recordedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            verifiedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return accounts;
  }

  async getAccount(id: string) {
    const account = await this.prisma.recoveryAccount.findUnique({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        vclopLoan: {
          include: {
            loanApplication: {
              select: {
                applicationNumber: true,
              },
            },
          },
        },
        assignedOfficer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        activities: {
          orderBy: { activityDate: 'desc' },
          take: 50,
          include: {
            recordedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            recordedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            verifiedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        promises: {
          orderBy: { promisedDate: 'desc' },
          include: {
            recordedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        expenses: {
          orderBy: { expenseDate: 'desc' },
          include: {
            recordedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!account) {
      throw new ResourceNotFoundException('Recovery Account', id);
    }

    return account;
  }

  async updateAccount(id: string, dto: UpdateRecoveryAccountDto, userId: string) {
    await this.getAccount(id); // Verify exists

    const updateData: any = { ...dto };

    // If assigning to a new officer, update assignment date
    if (dto.assignedOfficerId) {
      updateData.assignedDate = new Date();
    }

    const account = await this.prisma.recoveryAccount.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        assignedOfficer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.audit(userId, AuditAction.UPDATE, id, 'Updated recovery account');

    return account;
  }

  async deleteAccount(id: string, userId: string) {
    await this.getAccount(id); // Verify exists

    const account = await this.prisma.recoveryAccount.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.audit(userId, AuditAction.DELETE, id, 'Deleted recovery account');

    return account;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOVERY ACTIVITIES
  // ═══════════════════════════════════════════════════════════════════════════

  async createActivity(dto: CreateRecoveryActivityDto, recordedById: string) {
    await this.getAccount(dto.accountId); // Verify account exists

    const activity = await this.prisma.recoveryActivity.create({
      data: {
        ...dto,
        activityDate: dto.activityDate ? new Date(dto.activityDate) : new Date(),
        nextFollowupDate: dto.nextFollowupDate ? new Date(dto.nextFollowupDate) : null,
        recordedById,
      },
      include: {
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.audit(recordedById, AuditAction.CREATE, activity.id, 'Logged recovery activity');

    return activity;
  }

  async listActivities(accountId: string) {
    const activities = await this.prisma.recoveryActivity.findMany({
      where: { accountId },
      orderBy: { activityDate: 'desc' },
      include: {
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return activities;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOVERY PAYMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  async recordPayment(dto: CreateRecoveryPaymentDto, recordedById: string) {
    const account = await this.getAccount(dto.accountId);

    const payment = await this.prisma.recoveryPayment.create({
      data: {
        ...dto,
        paymentDate: new Date(dto.paymentDate),
        recordedById,
      },
      include: {
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.audit(recordedById, AuditAction.CREATE, payment.id, 'Recorded recovery payment');

    return payment;
  }

  async verifyPayment(paymentId: string, dto: VerifyPaymentDto, verifiedById: string) {
    const payment = await this.prisma.recoveryPayment.findUnique({
      where: { id: paymentId },
      include: { account: true },
    });

    if (!payment) {
      throw new ResourceNotFoundException('Payment', paymentId);
    }

    if (payment.status !== PaymentStatus.PENDING_VERIFICATION) {
      throw new BusinessException('Payment has already been verified or rejected');
    }

    const newStatus = dto.approved ? PaymentStatus.VERIFIED : PaymentStatus.REJECTED;

    // Update payment
    const updatedPayment = await this.prisma.recoveryPayment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        verifiedById,
        verifiedAt: new Date(),
        verificationNotes: dto.notes,
        rejectionReason: dto.approved ? null : dto.notes,
      },
    });

    // If approved, update account balances
    if (dto.approved) {
      const newRecoveredAmount = payment.account.recoveredAmount.toNumber() + payment.amount.toNumber();
      const newOutstandingBalance = payment.account.outstandingBalance.toNumber() - payment.amount.toNumber();
      const newNetRecovery = newRecoveredAmount - payment.account.totalExpenses.toNumber();

      await this.prisma.recoveryAccount.update({
        where: { id: payment.accountId },
        data: {
          recoveredAmount: newRecoveredAmount,
          outstandingBalance: Math.max(0, newOutstandingBalance),
          netRecovery: newNetRecovery,
          lastPaymentDate: payment.paymentDate,
          lastPaymentAmount: payment.amount,
        },
      });
    }

    this.audit(verifiedById, AuditAction.UPDATE, paymentId, `Payment ${dto.approved ? 'verified' : 'rejected'}`);

    return updatedPayment;
  }

  async listPayments(accountId: string) {
    const payments = await this.prisma.recoveryPayment.findMany({
      where: { accountId },
      orderBy: { paymentDate: 'desc' },
      include: {
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return payments;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPAYMENT PROMISES
  // ═══════════════════════════════════════════════════════════════════════════

  async createPromise(dto: CreateRepaymentPromiseDto, recordedById: string) {
    await this.getAccount(dto.accountId);

    const promise = await this.prisma.repaymentPromise.create({
      data: {
        ...dto,
        promisedDate: new Date(dto.promisedDate),
        recordedById,
      },
      include: {
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.audit(recordedById, AuditAction.CREATE, promise.id, 'Created repayment promise');

    return promise;
  }

  async updatePromiseStatus(promiseId: string, dto: UpdatePromiseStatusDto, userId: string) {
    const promise = await this.prisma.repaymentPromise.findUnique({
      where: { id: promiseId },
    });

    if (!promise) {
      throw new ResourceNotFoundException('Promise', promiseId);
    }

    const updatedPromise = await this.prisma.repaymentPromise.update({
      where: { id: promiseId },
      data: {
        status: dto.status,
        actualPaidAmount: dto.actualPaidAmount,
        actualPaidDate: dto.actualPaidDate ? new Date(dto.actualPaidDate) : null,
      },
    });

    this.audit(userId, AuditAction.UPDATE, promiseId, `Updated promise status to ${dto.status}`);

    return updatedPromise;
  }

  async listPromises(accountId: string) {
    const promises = await this.prisma.repaymentPromise.findMany({
      where: { accountId },
      orderBy: { promisedDate: 'desc' },
      include: {
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return promises;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOVERY EXPENSES
  // ═══════════════════════════════════════════════════════════════════════════

  async createExpense(dto: CreateRecoveryExpenseDto, recordedById: string) {
    const account = await this.getAccount(dto.accountId);

    const expense = await this.prisma.recoveryExpense.create({
      data: {
        ...dto,
        expenseDate: new Date(dto.expenseDate),
        recordedById,
      },
      include: {
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update account total expenses and net recovery
    const newTotalExpenses = account.totalExpenses.toNumber() + dto.amount;
    const newNetRecovery = account.recoveredAmount.toNumber() - newTotalExpenses;

    await this.prisma.recoveryAccount.update({
      where: { id: dto.accountId },
      data: {
        totalExpenses: newTotalExpenses,
        netRecovery: newNetRecovery,
      },
    });

    this.audit(recordedById, AuditAction.CREATE, expense.id, 'Recorded recovery expense');

    return expense;
  }

  async listExpenses(accountId: string) {
    const expenses = await this.prisma.recoveryExpense.findMany({
      where: { accountId },
      orderBy: { expenseDate: 'desc' },
      include: {
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return expenses;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD & REPORTS
  // ═══════════════════════════════════════════════════════════════════════════

  async getDashboard(branchIds?: string[], officerId?: string) {
    const where: any = { deletedAt: null };

    if (branchIds?.length) {
      where.branchId = { in: branchIds };
    }

    if (officerId) {
      where.assignedOfficerId = officerId;
    }

    const [
      totalAccounts,
      accountsByStatus,
      accountsBySource,
      totalOutstanding,
      totalRecovered,
      totalExpenses,
      netRecovery,
      recentPayments,
      activePromises,
      upcomingFollowups,
    ] = await Promise.all([
      // Total accounts
      this.prisma.recoveryAccount.count({ where }),

      // Accounts by status
      this.prisma.recoveryAccount.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      // Accounts by source
      this.prisma.recoveryAccount.groupBy({
        by: ['source'],
        where,
        _count: true,
      }),

      // Total outstanding
      this.prisma.recoveryAccount.aggregate({
        where,
        _sum: { outstandingBalance: true },
      }),

      // Total recovered
      this.prisma.recoveryAccount.aggregate({
        where,
        _sum: { recoveredAmount: true },
      }),

      // Total expenses
      this.prisma.recoveryAccount.aggregate({
        where,
        _sum: { totalExpenses: true },
      }),

      // Net recovery
      this.prisma.recoveryAccount.aggregate({
        where,
        _sum: { netRecovery: true },
      }),

      // Recent verified payments (last 30 days)
      this.prisma.recoveryPayment.findMany({
        where: {
          account: where,
          status: PaymentStatus.VERIFIED,
          paymentDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { paymentDate: 'desc' },
        take: 10,
        include: {
          account: {
            select: {
              accountNumber: true,
              customerName: true,
            },
          },
        },
      }),

      // Active promises
      this.prisma.repaymentPromise.count({
        where: {
          account: where,
          status: PromiseStatus.ACTIVE,
        },
      }),

      // Upcoming followups (next 7 days)
      this.prisma.recoveryActivity.findMany({
        where: {
          account: where,
          nextFollowupDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { nextFollowupDate: 'asc' },
        take: 20,
        include: {
          account: {
            select: {
              accountNumber: true,
              customerName: true,
              customerPhone: true,
            },
          },
        },
      }),
    ]);

    return {
      summary: {
        totalAccounts,
        totalOutstanding: totalOutstanding._sum.outstandingBalance?.toNumber() || 0,
        totalRecovered: totalRecovered._sum.recoveredAmount?.toNumber() || 0,
        totalExpenses: totalExpenses._sum.totalExpenses?.toNumber() || 0,
        netRecovery: netRecovery._sum.netRecovery?.toNumber() || 0,
        recoveryRate:
          totalOutstanding._sum.outstandingBalance && totalRecovered._sum.recoveredAmount
            ? (totalRecovered._sum.recoveredAmount.toNumber() /
                (totalOutstanding._sum.outstandingBalance.toNumber() + totalRecovered._sum.recoveredAmount.toNumber())) *
              100
            : 0,
      },
      accountsByStatus: accountsByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      accountsBySource: accountsBySource.map((item) => ({
        source: item.source,
        count: item._count,
      })),
      recentPayments,
      activePromises,
      upcomingFollowups,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private audit(actorId: string, action: AuditAction, entityId: string, description: string) {
    this.events.emit('audit.log', {
      actorId,
      action,
      entityType: 'RecoveryAccount',
      entityId,
      description,
    });
  }
}
