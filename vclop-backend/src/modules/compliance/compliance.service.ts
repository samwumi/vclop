import { Injectable } from '@nestjs/common';
import { AuditAction, WorkflowAction } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { ResourceNotFoundException } from '../../common/exceptions/app.exceptions';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService, private readonly events: EventEmitter2) {}

  async queue(branchIds: string[], isHQ: boolean) {
    // If HQ/non-location → see all. Otherwise filter by covered branches.
    const branchFilter = (!isHQ && branchIds.length > 0)
      ? { customer: { branchId: { in: branchIds } } }
      : {};

    return this.prisma.loanApplication.findMany({
      where: {
        deletedAt: null,
        status: { in: ['SUBMITTED', 'COMPLIANCE_REVIEW', 'AWAITING_INFORMATION'] },
        ...branchFilter,
      },
      include: {
        customer: { select: { customerNumber: true, firstName: true, lastName: true, phone: true, branchId: true, bvn: true, nin: true } },
        loanProduct: { select: { name: true } },
      },
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
    bvnVerifiedAt?: string | null; ninVerifiedAt?: string | null; phoneVerifiedAt?: string | null;
    employerVerifiedAt?: string | null; businessVerifiedAt?: string | null; residenceVerifiedAt?: string | null;
  }, actorId: string) {
    await this.assertApplication(applicationId);
    // Convert ISO strings to Date objects (or null) for Prisma
    const toDate = (v: string | null | undefined) => v === null ? null : v ? new Date(v) : undefined;
    const data = {
      ...payload,
      bvnVerifiedAt:       toDate(payload.bvnVerifiedAt),
      ninVerifiedAt:       toDate(payload.ninVerifiedAt),
      phoneVerifiedAt:     toDate(payload.phoneVerifiedAt),
      employerVerifiedAt:  toDate(payload.employerVerifiedAt),
      businessVerifiedAt:  toDate(payload.businessVerifiedAt),
      residenceVerifiedAt: toDate(payload.residenceVerifiedAt),
    };
    const assessment = await this.prisma.complianceAssessment.upsert({
      where:  { loanApplicationId: applicationId },
      create: { loanApplicationId: applicationId, assignedToId: actorId, ...data },
      update: data,
    });
    this.audit(actorId, AuditAction.UPDATE, applicationId, 'Updated compliance assessment');
    return assessment;
  }

  async listVisits(applicationId: string) {
    await this.assertApplication(applicationId);
    return this.prisma.fieldVisit.findMany({ where: { loanApplicationId: applicationId }, orderBy: { createdAt: 'desc' } });
  }

  async addVisit(applicationId: string, payload: {
    visitType: string; latitude?: number; longitude?: number; arrivedAt?: string; completedAt?: string; findings?: string; photos?: string;
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
        photos: payload.photos,
      },
    });
    this.audit(actorId, AuditAction.CREATE, applicationId, 'Recorded field visit');
    return visit;
  }

  // ── Customer-level field visits (KYC verification, independent of loan) ──

  async listCustomerVisits(customerId: string) {
    return this.prisma.fieldVisit.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addCustomerVisit(customerId: string, payload: {
    visitType: string; latitude?: number; longitude?: number; arrivedAt?: string; completedAt?: string; findings?: string; photos?: string;
  }, actorId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, deletedAt: null } });
    if (!customer) throw new ResourceNotFoundException('Customer', customerId);
    const visit = await this.prisma.fieldVisit.create({
      data: {
        customerId,
        conductedById: actorId,
        visitType: payload.visitType,
        latitude: payload.latitude,
        longitude: payload.longitude,
        arrivedAt: payload.arrivedAt ? new Date(payload.arrivedAt) : undefined,
        completedAt: payload.completedAt ? new Date(payload.completedAt) : undefined,
        findings: payload.findings,
        photos: payload.photos,
      },
    });
    this.audit(actorId, AuditAction.CREATE, customerId, 'Recorded KYC field visit for customer');
    return visit;
  }

  async getBranchIsHQ(branchId: string): Promise<boolean> {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId }, select: { isHeadOffice: true } });
    return branch?.isHeadOffice ?? false;
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
