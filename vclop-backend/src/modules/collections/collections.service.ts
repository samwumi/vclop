import { Injectable } from '@nestjs/common';
import { AuditAction, CollectionCaseStatus, LoanStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions/app.exceptions';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService, private readonly events: EventEmitter2) {}

  async list(status?: CollectionCaseStatus, branchIds?: string[], assignedOfficerId?: string) {
    // Build where with optional branch and officer scoping
    let caseWhere: Record<string, unknown> = status ? { status } : {};

    if (assignedOfficerId) {
      // Loan officer: only see cases for their own customers
      caseWhere = {
        ...caseWhere,
        loan: {
          loanApplication: {
            customer: { assignedOfficerId },
          },
        },
      };
    } else if (branchIds?.length) {
      // Compliance/accounting: see cases for customers in their managed branches
      caseWhere = {
        ...caseWhere,
        loan: {
          loanApplication: {
            customer: { branchId: { in: branchIds } },
          },
        },
      };
    }

    const cases = await this.prisma.collectionCase.findMany({
      where: caseWhere,
      orderBy: { updatedAt: 'desc' },
    });

    if (!cases.length) return cases;

    const loanIds = [...new Set(cases.map((c) => c.loanId))];

    const [loans, activities] = await Promise.all([
      this.prisma.loan.findMany({
        where: { id: { in: loanIds } },
        include: {
          installments: { orderBy: { installmentNumber: 'asc' } },
          loanApplication: {
            select: {
              id: true,
              applicationNumber: true,
              customer: { select: { id: true, firstName: true, lastName: true, customerNumber: true, phone: true } },
            },
          },
        },
      }),
      this.prisma.collectionActivity.findMany({
        where: { collectionCaseId: { in: cases.map((c) => c.id) } },
        orderBy: { occurredAt: 'desc' },
      }),
    ]);

    const loanMap = Object.fromEntries(loans.map((l) => [l.id, l]));
    const activityMap: Record<string, typeof activities> = {};
    for (const act of activities) {
      if (!activityMap[act.collectionCaseId]) activityMap[act.collectionCaseId] = [];
      activityMap[act.collectionCaseId]!.push(act);
    }

    return cases.map((c) => ({
      ...c,
      loan: loanMap[c.loanId] ?? null,
      activities: activityMap[c.id] ?? [],
    }));
  }

  async open(loanId: string, actorId: string, assignedToId?: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new ResourceNotFoundException('Loan', loanId);
    if (loan.status !== LoanStatus.ACTIVE && loan.status !== LoanStatus.DEFAULTED) throw new BusinessException('Only active or defaulted loans can enter collections');
    const item = await this.prisma.collectionCase.upsert({ where: { loanId }, create: { loanId, assignedToId }, update: { assignedToId: assignedToId ?? undefined } });
    this.audit(actorId, AuditAction.CREATE, item.id, 'Opened collection case');
    return item;
  }

  async update(id: string, data: { status?: CollectionCaseStatus; assignedToId?: string; nextActionAt?: Date; promiseAmount?: number; promiseDate?: Date; writeOffReason?: string }, actorId: string) {
    const item = await this.find(id);
    if (data.status === CollectionCaseStatus.WRITTEN_OFF && !data.writeOffReason) throw new BusinessException('A write-off reason is required');
    const resolved = data.status === CollectionCaseStatus.RESOLVED || data.status === CollectionCaseStatus.WRITTEN_OFF;
    const result = await this.prisma.collectionCase.update({ where: { id: item.id }, data: { ...data, resolvedAt: resolved ? new Date() : undefined } });
    this.audit(actorId, AuditAction.UPDATE, id, 'Updated collection case');
    return result;
  }

  async addActivity(id: string, data: { activityType: string; note: string; nextActionAt?: Date; metadata?: object }, actorId: string) {
    await this.find(id);
    const activity = await this.prisma.collectionActivity.create({ data: { collectionCaseId: id, performedById: actorId, ...data } });
    if (data.nextActionAt) await this.prisma.collectionCase.update({ where: { id }, data: { nextActionAt: data.nextActionAt } });
    this.audit(actorId, AuditAction.CREATE, id, `Recorded collection ${data.activityType.toLowerCase()}`);
    return activity;
  }

  private async find(id: string) { const item = await this.prisma.collectionCase.findUnique({ where: { id } }); if (!item) throw new ResourceNotFoundException('Collection case', id); return item; }
  private audit(userId: string, action: AuditAction, entityId: string, description: string) { this.events.emit('audit.log', { userId, action, module: 'collections', entityId, entityType: 'CollectionCase', description, isSuccess: true }); }
}
