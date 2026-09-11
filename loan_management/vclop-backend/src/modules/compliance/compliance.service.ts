import { Injectable } from '@nestjs/common';
import { AuditAction, WorkflowAction } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { ResourceNotFoundException } from '../../common/exceptions/app.exceptions';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService, private readonly events: EventEmitter2) {}

  async queue() {
    return this.prisma.loanApplication.findMany({
      where: { deletedAt: null, status: { in: ['COMPLIANCE_REVIEW', 'AWAITING_INFORMATION'] } },
      include: { customer: { select: { customerNumber: true, firstName: true, lastName: true, phone: true } }, loanProduct: { select: { name: true } } },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async assessment(applicationId: string) {
    await this.assertApplication(applicationId);
    return this.prisma.complianceAssessment.findUnique({ where: { loanApplicationId: applicationId } });
  }

  async saveAssessment(applicationId: string, payload: {
    bankStatementNotes?: string; incomeAssessment?: string; affordabilityScore?: number;
    cashFlowAssessment?: string; riskScore?: number; recommendation?: WorkflowAction; recommendationNotes?: string;
  }, actorId: string) {
    await this.assertApplication(applicationId);
    const assessment = await this.prisma.complianceAssessment.upsert({
      where: { loanApplicationId: applicationId },
      create: { loanApplicationId: applicationId, assignedToId: actorId, ...payload },
      update: payload,
    });
    this.audit(actorId, AuditAction.UPDATE, applicationId, 'Updated compliance assessment');
    return assessment;
  }

  async listVisits(applicationId: string) {
    await this.assertApplication(applicationId);
    return this.prisma.fieldVisit.findMany({ where: { loanApplicationId: applicationId }, orderBy: { createdAt: 'desc' } });
  }

  async addVisit(applicationId: string, payload: {
    visitType: string; latitude?: number; longitude?: number; arrivedAt?: string; completedAt?: string; findings?: string;
  }, actorId: string) {
    await this.assertApplication(applicationId);
    const visit = await this.prisma.fieldVisit.create({
      data: {
        loanApplicationId: applicationId,
        conductedById: actorId,
        visitType: payload.visitType,
        latitude: payload.latitude,
        longitude: payload.longitude,
        arrivedAt: payload.arrivedAt ? new Date(payload.arrivedAt) : undefined,
        completedAt: payload.completedAt ? new Date(payload.completedAt) : undefined,
        findings: payload.findings,
      },
    });
    this.audit(actorId, AuditAction.CREATE, applicationId, 'Recorded field visit');
    return visit;
  }

  private async assertApplication(id: string) {
    const application = await this.prisma.loanApplication.findFirst({ where: { id, deletedAt: null } });
    if (!application) throw new ResourceNotFoundException('Loan application', id);
    return application;
  }

  private audit(userId: string, action: AuditAction, entityId: string, description: string) {
    this.events.emit('audit.log', { userId, action, module: 'compliance', entityId, entityType: 'LoanApplication', description, isSuccess: true });
  }
}
