import { Injectable } from '@nestjs/common';
import { AuditAction, TransportRequestStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions/app.exceptions';

@Injectable()
export class TransportService {
  constructor(private readonly prisma: PrismaService, private readonly events: EventEmitter2) {}
  async list(status?: TransportRequestStatus, location?: string, requesterBranchId?: string) {
    // Build the base where clause
    const requests = await this.prisma.transportRequest.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(location ? { location: { contains: location } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!requests.length) return requests;

    const appIds = [...new Set(requests.map((r) => r.loanApplicationId))];
    const requesterIds = [...new Set(requests.map((r) => r.requestedById))];
    const reviewerIds = [...new Set(requests.filter((r) => r.reviewedById).map((r) => r.reviewedById!))];

    const [applications, requesters, reviewers] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where: { id: { in: appIds } },
        select: {
          id: true,
          applicationNumber: true,
          customer: {
            select: {
              id: true, firstName: true, lastName: true, customerNumber: true,
              branchId: true,
            },
          },
        },
      }),
      this.prisma.user.findMany({ where: { id: { in: requesterIds } }, select: { id: true, firstName: true, lastName: true, branchId: true } }),
      reviewerIds.length ? this.prisma.user.findMany({ where: { id: { in: reviewerIds } }, select: { id: true, firstName: true, lastName: true } }) : [],
    ]);

    const appMap = Object.fromEntries(applications.map((a) => [a.id, a]));
    const userMap = Object.fromEntries([...requesters, ...reviewers].map((u) => [u.id, u]));

    let enriched = requests.map((r) => ({
      ...r,
      loanApplication: appMap[r.loanApplicationId] ?? null,
      requestedBy: userMap[r.requestedById] ?? null,
      reviewedBy: r.reviewedById ? (userMap[r.reviewedById] ?? null) : null,
    }));

    // Scope compliance officers to requests from their own branch (where requester's branch matches)
    if (requesterBranchId) {
      const myRequesterIds = requesters
        .filter((u) => u.branchId === requesterBranchId)
        .map((u) => u.id);
      enriched = enriched.filter((r) => myRequesterIds.includes(r.requestedById));
    }

    return enriched;
  }
  async create(payload: { loanApplicationId: string; purpose: string; location: string; customerCount?: number; distanceKm?: number; estimatedCost?: number; suggestedAmount?: number }, actorId: string) {
    const application = await this.prisma.loanApplication.findFirst({ where: { id: payload.loanApplicationId, deletedAt: null } });
    if (!application) throw new ResourceNotFoundException('Loan application', payload.loanApplicationId);
    const request = await this.prisma.transportRequest.create({
      data: { ...payload, customerCount: payload.customerCount ?? 1, requestedById: actorId },
    });
    this.audit(actorId, AuditAction.CREATE, request.id, 'Created transport request');
    return request;
  }
  async review(id: string, approved: boolean, approvedAmount: number | undefined, reason: string | undefined, actorId: string) {
    const request = await this.find(id);
    if (request.status !== TransportRequestStatus.PENDING && request.status !== TransportRequestStatus.OPERATIONS_REVIEW) throw new BusinessException('Transport request is not awaiting review');
    if (!approved && !reason) throw new BusinessException('A reason is required when rejecting a transport request');
    const result = await this.prisma.transportRequest.update({ where: { id }, data: { status: approved ? TransportRequestStatus.APPROVED : TransportRequestStatus.REJECTED, approvedAmount, reason, reviewedById: actorId, reviewedAt: new Date() } });
    this.audit(actorId, AuditAction.UPDATE, id, approved ? 'Approved transport request' : 'Rejected transport request');
    return result;
  }
  async markPaid(id: string, actorId: string) { await this.find(id); const result = await this.prisma.transportRequest.update({ where: { id }, data: { status: TransportRequestStatus.PAID, paidById: actorId, paidAt: new Date() } }); this.audit(actorId, AuditAction.UPDATE, id, 'Paid transport request'); return result; }
  private async find(id: string) { const request = await this.prisma.transportRequest.findUnique({ where: { id } }); if (!request) throw new ResourceNotFoundException('Transport request', id); return request; }
  private audit(userId: string, action: AuditAction, entityId: string, description: string) { this.events.emit('audit.log', { userId, action, module: 'transport', entityId, entityType: 'TransportRequest', description, isSuccess: true }); }
}
