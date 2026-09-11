import { Injectable } from '@nestjs/common';
import { AuditAction, WorkflowAction } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { ResourceNotFoundException, BusinessException } from '../../common/exceptions/app.exceptions';
import { CreditBureauService } from './credit-bureau.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly creditBureau: CreditBureauService,
    private readonly usersService: UsersService,
  ) {}

  async queue(branchIds: string[], isHQ: boolean, actorId?: string) {
    // Apply location-based permissions if actorId is provided
    let effectiveBranchIds = branchIds;
    
    if (actorId) {
      const permittedBranchIds = await this.usersService.getUserPermittedBranchIds(actorId);
      
      if (permittedBranchIds.length > 0) {
        // User has specific location permissions - use those instead of role-based branches
        effectiveBranchIds = permittedBranchIds;
        isHQ = false; // Override HQ flag since user has specific location restrictions
      }
      // If permittedBranchIds is empty, user has no restrictions (admin/super-admin)
    }

    // If HQ/non-location → see all. Otherwise filter by covered branches.
    const branchFilter = (!isHQ && effectiveBranchIds.length > 0)
      ? { customer: { branchId: { in: effectiveBranchIds } } }
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

  // ── Customer-level field visits (KYC verification) ───────────────────────
  // Stored under the customer's most recent loan application — no schema change needed.

  async listCustomerVisits(customerId: string) {
    // Find all field visits across all of this customer's loan applications
    const applications = await this.prisma.loanApplication.findMany({
      where: { customerId, deletedAt: null },
      select: { id: true },
    });
    if (applications.length === 0) return [];
    const appIds = applications.map((a) => a.id);
    return this.prisma.fieldVisit.findMany({
      where: { loanApplicationId: { in: appIds } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addCustomerVisit(customerId: string, payload: {
    visitType: string; latitude?: number; longitude?: number; arrivedAt?: string; completedAt?: string; findings?: string; photos?: string;
  }, actorId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, deletedAt: null } });
    if (!customer) throw new ResourceNotFoundException('Customer', customerId);

    // Find the most recent loan application for this customer to anchor the visit
    const latestApp = await this.prisma.loanApplication.findFirst({
      where: { customerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!latestApp) {
      throw new ResourceNotFoundException(
        'Loan application',
        `No loan application found for customer ${customerId} — field visits must be linked to an application`,
      );
    }

    const visit = await this.prisma.fieldVisit.create({
      data: {
        loanApplicationId: latestApp.id,
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
    this.audit(actorId, AuditAction.CREATE, latestApp.id, `Recorded KYC field visit for customer ${customerId}`);
    return visit;
  }

  async getBranchIsHQ(branchId: string): Promise<boolean> {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId }, select: { isHeadOffice: true } });
    return branch?.isHeadOffice ?? false;
  }

  /**
   * Pull credit report from Mono Credit Bureau and store in compliance assessment
   */
  async pullCreditReport(applicationId: string, actorId: string) {
    const application = await this.prisma.loanApplication.findFirst({
      where: { id: applicationId, deletedAt: null },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            bvn: true,
            creditBureauConsent: true,
          },
        },
      },
    });

    if (!application) {
      throw new ResourceNotFoundException('Loan application', applicationId);
    }

    // Validate customer has BVN
    if (!application.customer.bvn) {
      throw new BusinessException('Customer BVN is required to pull credit report');
    }

    // Validate customer gave consent
    if (!application.customer.creditBureauConsent) {
      throw new BusinessException('Customer has not consented to credit bureau check');
    }

    // Fetch credit report from Mono
    const creditReport = await this.creditBureau.fetchCreditReport(
      application.customer.bvn,
      application.customer.firstName,
      application.customer.lastName,
    );

    // Calculate risk score and generate recommendation
    const riskScore = this.creditBureau.calculateRiskScore(creditReport);
    const recommendation = this.creditBureau.generateRecommendation(
      creditReport,
      Number(application.amount),
    );

    // Store credit report in compliance assessment
    const assessment = await this.prisma.complianceAssessment.upsert({
      where: { loanApplicationId: applicationId },
      create: {
        loanApplicationId: applicationId,
        assignedToId: actorId,
        creditBureauResult: JSON.stringify(creditReport),
        riskScore: riskScore,
        recommendation: recommendation.recommendation === 'APPROVE' ? WorkflowAction.APPROVE :
                       recommendation.recommendation === 'REJECT' ? WorkflowAction.REJECT :
                       WorkflowAction.REQUEST_INFORMATION,
        recommendationNotes: recommendation.reason,
      },
      update: {
        creditBureauResult: JSON.stringify(creditReport),
        riskScore: riskScore,
        recommendation: recommendation.recommendation === 'APPROVE' ? WorkflowAction.APPROVE :
                       recommendation.recommendation === 'REJECT' ? WorkflowAction.REJECT :
                       WorkflowAction.REQUEST_INFORMATION,
        recommendationNotes: recommendation.reason,
      },
    });

    this.audit(
      actorId,
      AuditAction.CREATE,
      applicationId,
      `Pulled credit report: Score ${creditReport.creditScore}, Risk ${riskScore}/100`,
    );

    return {
      creditReport,
      riskScore,
      recommendation,
      assessment,
    };
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
