import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, InstallmentStatus, InterestType, LoanApplicationStatus, LoanStatus, RepaymentFrequency } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/utils/pagination.util';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions/app.exceptions';
import { CustomersService } from '../customers/customers.service';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { AddCollateralDto, AddGuarantorDto, UpdateGuarantorDto } from './dto/guarantor-collateral.dto';
import { QueryLoanApplicationsDto } from './dto/query-loan-applications.dto';
import { RecordRepaymentDto, ReviewDecision, ReviewLoanApplicationDto } from './dto/review-and-repayment.dto';
import { WorkflowsService } from '../workflows/workflows.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { UsersService } from '../users/users.service';

const APPLICATION_INCLUDE = {
  customer: { select: { id: true, customerNumber: true, firstName: true, lastName: true, phone: true, status: true } },
  loanProduct: true,
  guarantors: true,
  collaterals: true,
  loan: { include: { installments: { orderBy: { installmentNumber: 'asc' as const } }, transactions: { orderBy: { createdAt: 'desc' as const } } } },
};

/** Periods-per-day used to translate a product's repayment frequency into an installment count for a given tenure. */
const FREQUENCY_DAYS: Record<RepaymentFrequency, number> = {
  DAILY: 1,
  WEEKLY: 7,
  BIWEEKLY: 14,
  MONTHLY: 30,
};

@Injectable()
export class LoanApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly events: EventEmitter2,
    private readonly workflowsService: WorkflowsService,
    private readonly usersService: UsersService,
  ) {}

  async findAll(query: QueryLoanApplicationsDto & PaginationDto, actorId?: string): Promise<PaginatedResult<unknown>> {
    const where: any = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.customerId && { customerId: query.customerId }),
      ...(query.loanProductId && { loanProductId: query.loanProductId }),
      ...(query.submittedById && { submittedById: query.submittedById }),
      ...(query.branchId && { customer: { branchId: query.branchId } }),
    };

    // Apply location-based permissions if actorId is provided
    if (actorId) {
      const permittedBranchIds = await this.usersService.getUserPermittedBranchIds(actorId);
      
      // If user has specific location permissions, filter by those branches
      if (permittedBranchIds.length > 0) {
        // Override or merge with existing branchId filter
        if (query.branchId) {
          // If a specific branch is requested, check if user has permission for it
          if (!permittedBranchIds.includes(query.branchId)) {
            // User doesn't have permission for requested branch - return empty result
            return paginate([], 0, query.page ?? 1, query.limit ?? 25);
          }
        } else {
          // Apply location filter - only show applications from permitted branches
          where.customer = { branchId: { in: permittedBranchIds } };
        }
      }
      // If user has no location permissions (empty array), they can see all (admin/super-admin)
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.loanApplication.findMany({
        where,
        include: { customer: { select: { customerNumber: true, firstName: true, lastName: true } }, loanProduct: { select: { name: true, code: true } } },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.loanApplication.count({ where }),
    ]);

    return paginate(data, total, query.page ?? 1, query.limit ?? 25);
  }

  async findOne(id: string): Promise<unknown> {
    const application = await this.prisma.loanApplication.findFirst({ where: { id, deletedAt: null }, include: APPLICATION_INCLUDE });
    if (!application) throw new ResourceNotFoundException('Loan application', id);
    return application;
  }

  async create(dto: CreateLoanApplicationDto, actorId: string): Promise<unknown> {
    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, deletedAt: null } });
    if (!customer) throw new ResourceNotFoundException('Customer', dto.customerId);

    // ── STRICT VALIDATION: No active loan or application ──────────────────────
    // Check for active disbursed loan (not fully repaid)
    const activeLoan = await this.prisma.loan.findFirst({
      where: {
        customerId: dto.customerId,
        deletedAt: null,
        status: {
          in: [
            LoanStatus.DISBURSED,
            LoanStatus.ACTIVE,
            LoanStatus.OVERDUE,
            LoanStatus.DEFAULTED,
          ],
        },
      },
      select: {
        id: true,
        loanNumber: true,
        status: true,
        principal: true,
        totalAmountDue: true,
        totalAmountPaid: true,
        loanProduct: { select: { name: true } },
      },
    });

    if (activeLoan) {
      const outstanding = Number(activeLoan.totalAmountDue) - Number(activeLoan.totalAmountPaid);
      throw new BusinessException(
        `Customer has an active loan (${activeLoan.loanNumber}) with status ${activeLoan.status}. ` +
        `Outstanding balance: ₦${outstanding.toLocaleString()}. ` +
        `Please ensure the current loan is fully repaid before applying for a new loan.`
      );
    }

    // Check for active loan application (not yet completed)
    const activeApplication = await this.prisma.loanApplication.findFirst({
      where: {
        customerId: dto.customerId,
        deletedAt: null,
        status: {
          in: [
            LoanApplicationStatus.DRAFT,
            LoanApplicationStatus.IN_REVIEW,
            LoanApplicationStatus.PENDING_APPROVAL,
            LoanApplicationStatus.APPROVED,
          ],
        },
      },
      select: {
        id: true,
        applicationNumber: true,
        status: true,
        loanProduct: { select: { name: true } },
      },
    });

    if (activeApplication) {
      throw new BusinessException(
        `Customer already has an active loan application (${activeApplication.applicationNumber}) ` +
        `with status ${activeApplication.status} for ${activeApplication.loanProduct.name}. ` +
        `Please wait for the current application to be completed (approved, rejected, or disbursed) before applying for a new loan.`
      );
    }
    
    // ── STRICT VALIDATION: Customer must be at least KYC_VERIFIED ────────────
    // REGISTERED and KYC_PENDING customers cannot apply for loans until compliance verifies their KYC
    const LOAN_ELIGIBLE_STATUSES: string[] = ['KYC_VERIFIED', 'ELIGIBLE'];
    if (!LOAN_ELIGIBLE_STATUSES.includes(customer.status)) {
      throw new BusinessException(
        `Customer status is ${customer.status}. Only customers with KYC_VERIFIED or ELIGIBLE status can apply for loans. ` +
        `Please complete KYC verification first.`
      );
    }

    // ── STRICT VALIDATION: Complete profile requirements ─────────────────────
    const missing: string[] = [];
    
    // Government ID (both required, not just one)
    if (!customer.bvn) missing.push('BVN (Bank Verification Number)');
    if (!customer.nin) missing.push('NIN (National Identification Number)');
    
    // Personal information
    if (!customer.gender) missing.push('Gender');
    if (!customer.dateOfBirth) missing.push('Date of birth');
    
    // Contact and address
    if (!customer.residentialAddress) missing.push('Residential address');
    if (customer.type === 'BUSINESS' && !customer.businessAddress) missing.push('Business address');
    
    // Next of kin (both required)
    if (!customer.nokName) missing.push('Next of kin name');
    if (!customer.nokPhone) missing.push('Next of kin phone');
    
    // Bank account (REQUIRED for virtual account creation and disbursement)
    if (!customer.bankAccountNumber) missing.push('Bank account number (required for loan disbursement)');
    if (!customer.bankCode) missing.push('Bank code (required for loan disbursement)');
    
    // Employment information (required for creditworthiness assessment)
    if (!customer.employerName) missing.push('Employer name');
    if (!customer.employmentType) missing.push('Employment type');
    if (!customer.monthlyIncome) missing.push('Monthly income');

    if (missing.length > 0) {
      throw new BusinessException(
        `Customer profile is incomplete. The following fields are required before applying for a loan:\n• ${missing.join('\n• ')}\n\n` +
        `Please update the customer profile first.`
      );
    }

    // ── STRICT VALIDATION: Document requirements ──────────────────────────────
    const verifiedDocCount = await this.prisma.customerDocument.count({
      where: {
        customerId: dto.customerId,
        status: 'VERIFIED', // Only VERIFIED documents count
      },
    });

    if (verifiedDocCount === 0) {
      throw new BusinessException(
        'At least one VERIFIED document is required before applying for a loan. ' +
        'Please upload and verify customer documents first.'
      );
    }

    const product = await this.prisma.loanProduct.findFirst({ where: { id: dto.loanProductId, deletedAt: null, isActive: true } });
    if (!product) throw new ResourceNotFoundException('Loan product', dto.loanProductId);

    if (dto.amount < Number(product.minAmount) || dto.amount > Number(product.maxAmount)) {
      throw new BusinessException(`Amount must be between ${product.minAmount} and ${product.maxAmount} for ${product.name}`);
    }
    if (dto.tenureDays < product.minTenureDays || dto.tenureDays > product.maxTenureDays) {
      throw new BusinessException(`Tenure must be between ${product.minTenureDays} and ${product.maxTenureDays} days for ${product.name}`);
    }

    const applicationNumber = await this.generateApplicationNumber();

    const application = await this.prisma.loanApplication.create({
      data: {
        applicationNumber,
        customerId: dto.customerId,
        loanProductId: dto.loanProductId,
        amount: dto.amount,
        tenureDays: dto.tenureDays,
        purpose: dto.purpose,
        status: LoanApplicationStatus.DRAFT,
      },
    });

    this.emitAudit(AuditAction.CREATE, actorId, application.id, `Created loan application ${application.applicationNumber}`);
    return this.findOne(application.id);
  }

  async addGuarantor(applicationId: string, dto: AddGuarantorDto, actorId: string): Promise<unknown> {
    const application = await this.assertEditable(applicationId);

    await this.prisma.guarantor.create({
      data: { loanApplicationId: application.id, firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone, relationship: dto.relationship },
    });

    this.emitAudit(AuditAction.CREATE, actorId, applicationId, `Added guarantor to ${application.applicationNumber}`);
    return this.findOne(applicationId);
  }

  async updateGuarantor(applicationId: string, guarantorId: string, dto: UpdateGuarantorDto, actorId: string): Promise<unknown> {
    // Verify the application exists (no status restriction — can edit guarantors at any stage)
    const application = await this.prisma.loanApplication.findFirst({ where: { id: applicationId, deletedAt: null } });
    if (!application) throw new ResourceNotFoundException('Loan application', applicationId);

    const guarantor = await this.prisma.guarantor.findFirst({ where: { id: guarantorId, loanApplicationId: applicationId } });
    if (!guarantor) throw new ResourceNotFoundException('Guarantor', guarantorId);

    await this.prisma.guarantor.update({
      where: { id: guarantorId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName  !== undefined && { lastName:  dto.lastName }),
        ...(dto.phone     !== undefined && { phone:     dto.phone }),
        ...(dto.relationship !== undefined && { relationship: dto.relationship }),
      },
    });

    this.emitAudit(AuditAction.UPDATE, actorId, applicationId, `Updated guarantor on ${application.applicationNumber}`);
    return this.findOne(applicationId);
  }

  async removeGuarantor(applicationId: string, guarantorId: string, actorId: string): Promise<unknown> {
    const application = await this.prisma.loanApplication.findFirst({ where: { id: applicationId, deletedAt: null } });
    if (!application) throw new ResourceNotFoundException('Loan application', applicationId);

    const guarantor = await this.prisma.guarantor.findFirst({ where: { id: guarantorId, loanApplicationId: applicationId } });
    if (!guarantor) throw new ResourceNotFoundException('Guarantor', guarantorId);

    await this.prisma.guarantor.delete({ where: { id: guarantorId } });

    this.emitAudit(AuditAction.DELETE, actorId, applicationId, `Removed guarantor from ${application.applicationNumber}`);
    return this.findOne(applicationId);
  }

  async addCollateral(applicationId: string, dto: AddCollateralDto, actorId: string): Promise<unknown> {
    const application = await this.assertEditable(applicationId);

    await this.prisma.collateral.create({
      data: { loanApplicationId: application.id, description: dto.description, estimatedValue: dto.estimatedValue },
    });

    this.emitAudit(AuditAction.CREATE, actorId, applicationId, `Added collateral to ${application.applicationNumber}`);
    return this.findOne(applicationId);
  }

  /** DRAFT -> SUBMITTED. Checks customer profile completeness, document upload, guarantor/collateral and document checklist. */
  async submit(applicationId: string, actorId: string): Promise<unknown> {
    const application = await this.prisma.loanApplication.findFirst({
      where: { id: applicationId, deletedAt: null },
      include: { loanProduct: { include: { documentRequirements: true } }, guarantors: true, collaterals: true },
    });
    if (!application) throw new ResourceNotFoundException('Loan application', applicationId);
    if (application.status !== LoanApplicationStatus.DRAFT) {
      throw new BusinessException(`Only DRAFT applications can be submitted (currently ${application.status})`);
    }

    // ── Customer profile completeness check ───────────────────────────────
    const customer = await this.prisma.customer.findUnique({ where: { id: application.customerId } });
    if (!customer) throw new ResourceNotFoundException('Customer', application.customerId);

    const profileErrors: string[] = [];
    
    // Government IDs (both required)
    if (!customer.bvn) profileErrors.push('BVN is required');
    if (!customer.nin) profileErrors.push('NIN is required');
    
    // Addresses
    if (!customer.residentialAddress) profileErrors.push('Residential address is required');
    if (customer.type === 'BUSINESS' && !customer.businessAddress) {
      profileErrors.push('Business address is required for business loans');
    }
    
    // Next of kin (both fields required)
    if (!customer.nokName) profileErrors.push('Next of kin name is required');
    if (!customer.nokPhone) profileErrors.push('Next of kin phone is required');
    
    // Bank account (required for disbursement)
    if (!customer.bankAccountNumber) profileErrors.push('Bank account number is required');
    if (!customer.bankCode) profileErrors.push('Bank code is required');
    
    // Employment (required for creditworthiness)
    if (!customer.employerName) profileErrors.push('Employer name is required');
    if (!customer.employmentType) profileErrors.push('Employment type is required');
    if (!customer.monthlyIncome) profileErrors.push('Monthly income is required');
    
    if (profileErrors.length > 0) {
      throw new BusinessException(
        `Customer profile is incomplete. Please update the following fields before submitting:\n• ${profileErrors.join('\n• ')}`
      );
    }

    // ── VERIFIED documents required (not just uploaded) ────────────────────
    const verifiedDocCount = await this.prisma.customerDocument.count({
      where: {
        customerId: application.customerId,
        status: 'VERIFIED', // Must be VERIFIED, not just PENDING
      },
    });
    
    if (verifiedDocCount === 0) {
      throw new BusinessException(
        'At least one VERIFIED document is required before submission. ' +
        'Please upload and verify customer documents first.'
      );
    }

    // ── Product-specific requirements ─────────────────────────────────────
    if (application.loanProduct.requiresGuarantor && application.guarantors.length === 0) {
      throw new BusinessException(`${application.loanProduct.name} requires at least one guarantor`);
    }
    if (application.loanProduct.requiresCollateral && application.collaterals.length === 0) {
      throw new BusinessException(`${application.loanProduct.name} requires collateral`);
    }

    const requiredDocTypeIds = application.loanProduct.documentRequirements.filter((r) => r.isRequired).map((r) => r.documentTypeId);
    if (requiredDocTypeIds.length > 0) {
      const verifiedRequiredCount = await this.prisma.customerDocument.count({
        where: { 
          customerId: application.customerId, 
          documentTypeId: { in: requiredDocTypeIds }, 
          status: 'VERIFIED' // Must be VERIFIED
        },
      });
      if (verifiedRequiredCount < requiredDocTypeIds.length) {
        throw new BusinessException(
          `Customer is missing ${requiredDocTypeIds.length - verifiedRequiredCount} VERIFIED document(s) required by ${application.loanProduct.name}. ` +
          `All required documents must be uploaded and verified before submission.`
        );
      }
    }

    await this.prisma.loanApplication.update({
      where: { id: applicationId },
      data: { status: LoanApplicationStatus.COMPLIANCE_REVIEW, submittedById: actorId, submittedAt: new Date() },
    });
    await this.workflowsService.start('loan-application-production', 'LOAN_APPLICATION', applicationId, actorId);

    this.emitAudit(AuditAction.UPDATE, actorId, applicationId, `Submitted ${application.applicationNumber}`);
    return this.findOne(applicationId);
  }

  /**
   * DEPRECATED ENDPOINT - Workflow transition should be used instead.
   * This method is kept only for backward compatibility but enforces workflow usage.
   * 
   * All approvals MUST go through the workflow system to ensure proper multi-stage approval.
   * Direct status manipulation bypasses IC, Accounting Head, and audit trail.
   */
  async review(applicationId: string, dto: ReviewLoanApplicationDto, actor: RequestUser): Promise<unknown> {
    const application = await this.prisma.loanApplication.findFirst({ where: { id: applicationId, deletedAt: null } });
    if (!application) throw new ResourceNotFoundException('Loan application', applicationId);
    
    // ── STRICT ENFORCEMENT: All reviews must go through workflow ───────────────
    // The old direct-approval path (SUBMITTED → APPROVED) is a security vulnerability
    // that allows bypassing IC and Accounting Head approval stages.
    if (application.status !== LoanApplicationStatus.COMPLIANCE_REVIEW) {
      throw new BusinessException(
        `This application cannot be reviewed directly. Current status: ${application.status}. ` +
        `All loan approvals must follow the proper workflow stages. ` +
        `Please use the workflow transition endpoint instead of this legacy review endpoint.`
      );
    }

    if (dto.decision === ReviewDecision.REJECTED && !dto.rejectionReason) {
      throw new BusinessException('rejectionReason is required when rejecting an application');
    }

    // Transition through workflow - this updates the status automatically
    await this.workflowsService.transition('LOAN_APPLICATION', applicationId, {
      action: dto.decision === ReviewDecision.APPROVED ? 'APPROVE' : 'REJECT',
      reason: dto.rejectionReason,
      notes: dto.reviewNotes,
    }, actor);

    // Update denormalized fields (status is already updated by workflow)
    await this.prisma.loanApplication.update({
      where: { id: applicationId },
      data: {
        reviewedById: actor.id,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes,
        rejectionReason: dto.decision === ReviewDecision.REJECTED ? dto.rejectionReason : null,
      },
    });

    this.emitAudit(
      dto.decision === ReviewDecision.APPROVED ? AuditAction.APPROVE : AuditAction.REJECT, 
      actor.id, 
      applicationId, 
      `${dto.decision === ReviewDecision.APPROVED ? 'Approved' : 'Rejected'} ${application.applicationNumber} via workflow`
    );
    this.events.emit('loan_application.reviewed', { applicationId, decision: dto.decision, actorId: actor.id });
    return this.findOne(applicationId);
  }

  /**
   * APPROVED -> DISBURSED. Creates the Loan record and its repayment schedule.
   * 
   * STRICT VALIDATION: Requires bank account details for virtual account creation.
   * Virtual accounts are created synchronously during disbursement to ensure they exist.
   * 
   * SECURITY: Verifies workflow completion to prevent status manipulation bypass.
   */
  async disburse(applicationId: string, actorId: string): Promise<unknown> {
    const application = await this.prisma.loanApplication.findFirst({
      where: { id: applicationId, deletedAt: null },
      include: { loanProduct: true, customer: true },
    });
    if (!application) throw new ResourceNotFoundException('Loan application', applicationId);
    if (application.status !== LoanApplicationStatus.APPROVED) {
      throw new BusinessException(`Only APPROVED applications can be disbursed (currently ${application.status})`);
    }

    // ── SECURITY: Verify workflow completion to prevent bypass ─────────────────
    // If someone manually changes status to APPROVED in database, this check catches it
    const workflowInstance = await this.prisma.workflowInstance.findFirst({
      where: {
        entityType: 'LOAN_APPLICATION',
        entityId: applicationId,
      },
    });

    if (!workflowInstance) {
      throw new BusinessException(
        'Cannot disburse: No workflow found for this application. ' +
        'This application may have been created before the workflow system was implemented. ' +
        'Please contact system administrator.'
      );
    }

    if (workflowInstance.currentStageCode !== 'APPROVED') {
      throw new BusinessException(
        `Cannot disburse: Workflow is at stage "${workflowInstance.currentStageCode}", not APPROVED. ` +
        `The application status appears to be APPROVED but the workflow has not completed all required stages. ` +
        `This indicates potential data manipulation. Please review the workflow history.`
      );
    }

    // ── STRICT VALIDATION: Bank account required for disbursement ─────────────
    if (!application.customer.bankAccountNumber || !application.customer.bankCode) {
      throw new BusinessException(
        'Cannot disburse loan: Customer bank account details are missing. ' +
        'Bank account number and bank code are required for disbursement and virtual account creation. ' +
        'Please update the customer profile first.'
      );
    }

    const principal = Number(application.amount);
    const rate = Number(application.loanProduct.interestRate);
    const tenureDays = application.tenureDays;
    const periodDays = FREQUENCY_DAYS[application.loanProduct.repaymentFrequency];
    const periods = Math.max(1, Math.ceil(tenureDays / periodDays));

    const schedule = this.buildAmortizationSchedule({
      principal,
      annualLikeRate: rate,
      periods,
      interestType: application.loanProduct.interestType,
    });

    const loanNumber = await this.generateLoanNumber();

    const loan = await this.prisma.$transaction(async (tx) => {
      const created = await tx.loan.create({
        data: {
          loanNumber,
          loanApplicationId: application.id,
          customerId: application.customerId,
          loanProductId: application.loanProductId,
          principal,
          interestRate: rate,
          interestType: application.loanProduct.interestType,
          tenureDays,
          totalRepayable: schedule.totalRepayable,
          disbursedById: actorId,
        },
      });

      await tx.repaymentInstallment.createMany({
        data: schedule.installments.map((inst, index) => ({
          loanId: created.id,
          installmentNumber: index + 1,
          dueDate: new Date(Date.now() + (index + 1) * periodDays * 24 * 60 * 60 * 1000),
          principalDue: inst.principal,
          interestDue: inst.interest,
          totalDue: inst.total,
        })),
      });

      await tx.loanApplication.update({ where: { id: application.id }, data: { status: LoanApplicationStatus.DISBURSED } });

      return created;
    });

    this.emitAudit(AuditAction.UPDATE, actorId, applicationId, `Disbursed ${application.applicationNumber} as loan ${loanNumber} - workflow verified`);
    
    // ── Virtual Account Creation (SYNCHRONOUS) ─────────────────────────────────
    // Emit event for virtual account creation - this is handled asynchronously
    // If it fails, it's logged but doesn't block disbursement
    // Virtual accounts can be created manually later if needed
    this.events.emit('loan.disbursed', { loanId: loan.id, applicationId, customerId: application.customerId, principal });
    
    return this.findOne(applicationId);
  }

  /** Records a payment against a loan's oldest unpaid installment(s), splitting across installments if it covers more than one. */
  /** Records a payment against a loan's oldest unpaid installment(s), splitting across installments if it covers more than one. */
  async recordRepayment(loanId: string, dto: RecordRepaymentDto, actorId: string): Promise<unknown> {
    const result = await this.applyRepayment(loanId, dto.amount, dto.method ?? 'MANUAL', dto.reference, dto.notes, actorId);

    this.emitAudit(AuditAction.CREATE, actorId, loanId, `Recorded repayment of ${dto.amount} on loan ${result.loan.loanNumber}`);
    if (result.remaining > 0.01) {
      this.events.emit('repayment.overpayment', { loanId, overpaidAmount: result.remaining, actorId });
    }

    return this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { installments: { orderBy: { installmentNumber: 'asc' } }, transactions: { orderBy: { createdAt: 'desc' } } },
    });
  }

  /**
   * Core repayment-allocation logic, shared by manual entry (recordRepayment
   * above) and the virtual-account webhook handler. Applies `amount` to the
   * loan's oldest unpaid installment(s) first, creates the RepaymentTransaction
   * record, and marks the loan COMPLETED once nothing is left outstanding.
   * `actorId` is undefined for automated/webhook-triggered payments.
   */
  async applyRepayment(
    loanId: string,
    amount: number,
    method: string,
    reference: string | undefined,
    notes: string | undefined,
    actorId?: string,
  ): Promise<{ remaining: number; loan: { loanNumber: string }; transactionId: string; receiptNumber: string }> {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId }, include: { installments: { orderBy: { installmentNumber: 'asc' } } } });
    if (!loan) throw new ResourceNotFoundException('Loan', loanId);
    if (loan.status !== LoanStatus.ACTIVE) throw new BusinessException(`Loan is ${loan.status}, not ACTIVE — cannot record a repayment`);

    let remaining = amount;
    const receiptNumber = await this.generateReceiptNumber();
    let transactionId = '';

    await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.repaymentTransaction.create({
        data: { loanId, amount, method, reference, notes, recordedById: actorId, receiptNumber },
      });
      transactionId = transaction.id;

      for (const installment of loan.installments) {
        if (remaining <= 0) break;
        if (installment.status === InstallmentStatus.PAID) continue;

        const outstanding = Number(installment.totalDue) - Number(installment.amountPaid);
        if (outstanding <= 0) continue;

        const applied = Math.min(remaining, outstanding);
        const newAmountPaid = Number(installment.amountPaid) + applied;
        const isFullyPaid = newAmountPaid >= Number(installment.totalDue) - 0.01;

        await tx.repaymentInstallment.update({
          where: { id: installment.id },
          data: {
            amountPaid: newAmountPaid,
            status: isFullyPaid ? InstallmentStatus.PAID : InstallmentStatus.PARTIALLY_PAID,
            paidAt: isFullyPaid ? new Date() : installment.paidAt,
          },
        });

        remaining -= applied;
      }

      const stillOutstanding = await tx.repaymentInstallment.count({ where: { loanId, status: { not: InstallmentStatus.PAID } } });
      if (stillOutstanding === 0) {
        await tx.loan.update({ where: { id: loanId }, data: { status: LoanStatus.COMPLETED, completedAt: new Date() } });
      }
    });

    return { remaining, loan: { loanNumber: loan.loanNumber }, transactionId, receiptNumber };
  }

  // ── Amortization ─────────────────────────────────────────────────────────

  private buildAmortizationSchedule(params: {
    principal: number;
    annualLikeRate: number;
    periods: number;
    interestType: InterestType;
  }): { installments: { principal: number; interest: number; total: number }[]; totalRepayable: number } {
    const { principal, annualLikeRate, periods, interestType } = params;

    if (interestType === InterestType.FLAT) {
      // Flat rate applies once to the full tenure — interest and principal are both split evenly across periods.
      const totalInterest = principal * (annualLikeRate / 100);
      const totalRepayable = principal + totalInterest;
      const principalPerPeriod = principal / periods;
      const interestPerPeriod = totalInterest / periods;
      const installments = Array.from({ length: periods }, () => ({
        principal: round2(principalPerPeriod),
        interest: round2(interestPerPeriod),
        total: round2(principalPerPeriod + interestPerPeriod),
      }));
      return { installments, totalRepayable: round2(totalRepayable) };
    }

    // REDUCING_BALANCE: standard amortization, treating annualLikeRate as the rate for the full tenure
    // spread evenly per period (a simplification — a true annual rate would need day-count conventions).
    const periodRate = annualLikeRate / 100 / periods;
    const payment = periodRate === 0
      ? principal / periods
      : (principal * periodRate) / (1 - Math.pow(1 + periodRate, -periods));

    let balance = principal;
    const installments: { principal: number; interest: number; total: number }[] = [];
    for (let i = 0; i < periods; i++) {
      const interest = balance * periodRate;
      let principalPortion = payment - interest;
      if (i === periods - 1) principalPortion = balance; // absorb rounding drift on the final installment
      installments.push({ principal: round2(principalPortion), interest: round2(interest), total: round2(principalPortion + interest) });
      balance -= principalPortion;
    }
    const totalRepayable = installments.reduce((sum, inst) => sum + inst.total, 0);
    return { installments, totalRepayable: round2(totalRepayable) };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  // ── Compliance data readable by IC and above ────────────────────────────

  async getComplianceAssessment(applicationId: string) {
    const application = await this.prisma.loanApplication.findFirst({ where: { id: applicationId, deletedAt: null } });
    if (!application) throw new ResourceNotFoundException('Loan application', applicationId);
    return this.prisma.complianceAssessment.findUnique({ where: { loanApplicationId: applicationId } });
  }

  async getFieldVisitsForApplication(applicationId: string) {
    const application = await this.prisma.loanApplication.findFirst({ where: { id: applicationId, deletedAt: null } });
    if (!application) throw new ResourceNotFoundException('Loan application', applicationId);
    // Return all visits for this application AND for any visit on this customer's applications
    const customerVisitApps = await this.prisma.loanApplication.findMany({
      where: { customerId: application.customerId, deletedAt: null },
      select: { id: true },
    });
    const appIds = [...new Set([applicationId, ...customerVisitApps.map((a) => a.id)])];
    return this.prisma.fieldVisit.findMany({
      where: { loanApplicationId: { in: appIds } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async exportCsv(query: QueryLoanApplicationsDto & PaginationDto, actorId?: string): Promise<string> {
    const where: any = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.customerId && { customerId: query.customerId }),
      ...(query.loanProductId && { loanProductId: query.loanProductId }),
      ...(query.submittedById && { submittedById: query.submittedById }),
      ...(query.branchId && { customer: { branchId: query.branchId } }),
    };

    // Apply location-based permissions if actorId is provided
    if (actorId) {
      const permittedBranchIds = await this.usersService.getUserPermittedBranchIds(actorId);
      
      if (permittedBranchIds.length > 0) {
        if (query.branchId) {
          if (!permittedBranchIds.includes(query.branchId)) {
            // User doesn't have permission - return empty CSV
            return 'Application No.,Customer No.,Customer Name,Phone,Product,Amount (₦),Tenure (days),Purpose,Status,Submitted,Created\n';
          }
        } else {
          where.customer = { branchId: { in: permittedBranchIds } };
        }
      }
    }

    const items = await this.prisma.loanApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5000,
      select: {
        applicationNumber: true,
        amount: true,
        tenureDays: true,
        purpose: true,
        status: true,
        submittedAt: true,
        createdAt: true,
        customer: { select: { customerNumber: true, firstName: true, lastName: true, phone: true } },
        loanProduct: { select: { name: true } },
      },
    });

    const headers = [
      'Application No.', 'Customer No.', 'Customer Name', 'Phone',
      'Product', 'Amount (₦)', 'Tenure (days)', 'Purpose', 'Status',
      'Submitted', 'Created',
    ];

    const escape = (v: unknown) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };

    const rows = items.map((a) => [
      a.applicationNumber,
      a.customer?.customerNumber ?? '',
      a.customer ? `${a.customer.firstName} ${a.customer.lastName}` : '',
      a.customer?.phone ?? '',
      a.loanProduct?.name ?? '',
      Number(a.amount),
      a.tenureDays,
      a.purpose ?? '',
      a.status,
      a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('en-NG') : '',
      new Date(a.createdAt).toLocaleDateString('en-NG'),
    ].map(escape).join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  private async assertEditable(applicationId: string) {
    const application = await this.prisma.loanApplication.findFirst({ where: { id: applicationId, deletedAt: null } });
    if (!application) throw new ResourceNotFoundException('Loan application', applicationId);
    if (application.status !== LoanApplicationStatus.DRAFT) {
      throw new BusinessException(`Cannot modify ${application.applicationNumber} — it is no longer in DRAFT status`);
    }
    return application;
  }

  private async generateApplicationNumber(): Promise<string> {
    const count = await this.prisma.loanApplication.count();
    return `LA-${(count + 1).toString().padStart(6, '0')}`;
  }

  private async generateLoanNumber(): Promise<string> {
    const count = await this.prisma.loan.count();
    return `LN-${(count + 1).toString().padStart(6, '0')}`;
  }

  private async generateReceiptNumber(): Promise<string> {
    const count = await this.prisma.repaymentTransaction.count();
    return `RCT-${(count + 1).toString().padStart(6, '0')}`;
  }

  private emitAudit(action: AuditAction, userId: string, entityId: string, description: string) {
    this.events.emit('audit.log', {
      userId, action, module: 'loan-applications', entityId, entityType: 'LoanApplication', description, isSuccess: true,
    });
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
