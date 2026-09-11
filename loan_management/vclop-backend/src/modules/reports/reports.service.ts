import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, InstallmentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService, private readonly events: EventEmitter2) {}
  async portfolio(actorId: string) {
    const [loans, byStatus, outstanding] = await Promise.all([
      this.prisma.loan.count(), this.prisma.loan.groupBy({ by: ['status'], _count: { _all: true }, _sum: { principal: true, totalRepayable: true } }),
      this.prisma.repaymentInstallment.aggregate({ where: { status: { not: InstallmentStatus.PAID } }, _sum: { totalDue: true, amountPaid: true } }),
    ]);
    this.audit(actorId, 'Viewed loan portfolio report');
    return { loans, byStatus, outstanding: Number(outstanding._sum.totalDue ?? 0) - Number(outstanding._sum.amountPaid ?? 0) };
  }
  async disbursements(actorId: string, from?: Date, to?: Date) {
    const where = from || to ? { disbursedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {};
    const [items, totals] = await Promise.all([
      this.prisma.loan.findMany({ where, include: { loanApplication: { include: { customer: { select: { customerNumber: true, firstName: true, lastName: true } }, loanProduct: { select: { name: true } } } } }, orderBy: { disbursedAt: 'desc' }, take: 500 }),
      this.prisma.loan.aggregate({ where, _count: { _all: true }, _sum: { principal: true } }),
    ]);
    this.audit(actorId, 'Viewed disbursement report'); return { items, totalCount: totals._count._all, totalAmount: Number(totals._sum.principal ?? 0) };
  }
  async collections(actorId: string) {
    const [overdue, cases, repayments] = await Promise.all([
      this.prisma.repaymentInstallment.findMany({ where: { dueDate: { lt: new Date() }, status: { in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID, InstallmentStatus.OVERDUE] } }, include: { loan: { select: { loanNumber: true, customerId: true } } }, orderBy: { dueDate: 'asc' }, take: 500 }),
      this.prisma.collectionCase.groupBy({ by: ['status'], _count: { _all: true } }), this.prisma.repaymentTransaction.aggregate({ _sum: { amount: true } }),
    ]);
    this.audit(actorId, 'Viewed collections report'); return { overdue, cases, totalRepayments: Number(repayments._sum.amount ?? 0) };
  }
  private audit(userId: string, description: string) { this.events.emit('audit.log', { userId, action: AuditAction.READ, module: 'reports', description, isSuccess: true }); }
}
