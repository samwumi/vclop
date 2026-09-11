import { Injectable } from '@nestjs/common';
import { AuditAction, TransportRequestStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions/app.exceptions';

@Injectable()
export class TransportService {
  constructor(private readonly prisma: PrismaService, private readonly events: EventEmitter2) {}
  list(status?: TransportRequestStatus) { return this.prisma.transportRequest.findMany({ where: status ? { status } : {}, orderBy: { createdAt: 'desc' } }); }
  async create(payload: { loanApplicationId: string; purpose: string; location: string; distanceKm?: number; estimatedCost?: number; suggestedAmount?: number }, actorId: string) {
    const application = await this.prisma.loanApplication.findFirst({ where: { id: payload.loanApplicationId, deletedAt: null } });
    if (!application) throw new ResourceNotFoundException('Loan application', payload.loanApplicationId);
    const request = await this.prisma.transportRequest.create({ data: { ...payload, requestedById: actorId } });
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
