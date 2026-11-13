import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RepaymentService } from './repayment.service';
import { StaffLoanStatus } from '@prisma/client';
import {
  STAFF_LOAN_CONFIG,
  calculateMaxLoanAmount,
  calculateLoanDetails,
  validateSalaryDeduction,
  validateTenure,
} from './staff-loan-config';

@Injectable()
export class StaffLoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repaymentService: RepaymentService,
  ) {}

  /**
   * Apply for staff loan
   */
  async applyForLoan(data: {
    userId: string;
    loanPurpose: string;
    requestedAmount: number;
    proposedTenureMonths: number;
    justification: string;
  }) {
    // Validate tenure against business rules
    const tenureValidation = validateTenure(data.proposedTenureMonths);
    if (!tenureValidation.valid) {
      throw new BadRequestException(tenureValidation.message);
    }

    // Check eligibility (not on final notice, no outstanding overdue loans)
    const employmentPeriods = await this.prisma.employmentPeriod.findMany({
      where: {
        userId: data.userId,
        isCurrent: true,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === 'SUSPENDED') {
      throw new BadRequestException('Suspended employees cannot apply for loans');
    }

    const currentEmployment = employmentPeriods[0];
    if (!currentEmployment) {
      throw new BadRequestException('No active employment found');
    }

    // Get current salary
    const monthlySalary = currentEmployment.salary ? Number(currentEmployment.salary) : 0;
    if (!monthlySalary || monthlySalary <= 0) {
      throw new BadRequestException('Valid salary information is required to apply for a loan');
    }

    // Check if user already has active loans
    const activeLoans = await this.prisma.staffLoan.findMany({
      where: {
        userId: data.userId,
        status: { in: ['ACTIVE', 'PENDING_APPROVAL', 'APPROVED', 'DISBURSED'] },
      },
    });

    if (activeLoans.length > STAFF_LOAN_CONFIG.MAX_ACTIVE_LOANS) {
      throw new BadRequestException('You already have an active loan. Only one loan is allowed at a time');
    }

    // Check for overdue installments
    const hasOverdue = await this.prisma.staffLoanInstallment.findFirst({
      where: {
        staffLoan: { userId: data.userId },
        status: 'OVERDUE' as any,
      },
    });

    if (hasOverdue) {
      throw new BadRequestException(
        'Cannot apply for new loan with overdue installments',
      );
    }

    // Calculate maximum eligible loan amount based on salary
    const maxLoanAmount = calculateMaxLoanAmount(monthlySalary);
    if (data.requestedAmount > maxLoanAmount) {
      throw new BadRequestException(
        `Requested amount (${data.requestedAmount}) exceeds maximum eligible loan amount (${maxLoanAmount.toFixed(2)}). ` +
        `Maximum is calculated as 25% of your monthly salary (${monthlySalary}) × ${STAFF_LOAN_CONFIG.MAX_TENURE_MONTHS} months.`
      );
    }

    // Validate minimum loan amount
    if (data.requestedAmount < STAFF_LOAN_CONFIG.MIN_LOAN_AMOUNT) {
      throw new BadRequestException(
        `Minimum loan amount is ${STAFF_LOAN_CONFIG.MIN_LOAN_AMOUNT}`
      );
    }

    // Calculate loan details with business rules
    const loanDetails = calculateLoanDetails(
      data.requestedAmount,
      data.proposedTenureMonths,
    );

    // Validate that monthly installment is within salary deduction limits
    const deductionValidation = validateSalaryDeduction(
      loanDetails.monthlyInstallment,
      monthlySalary,
    );

    if (!deductionValidation.valid) {
      throw new BadRequestException(deductionValidation.message);
    }

    // Generate loan number
    const loanNumber = await this.generateLoanNumber();

    // Create loan application (DRAFT - awaiting approval)
    const loan = await this.prisma.staffLoan.create({
      data: {
        loanNumber,
        userId: data.userId,
        purpose: data.loanPurpose,
        requestedAmount: data.requestedAmount,
        justification: data.justification,
        // Apply business rules: 0% interest, 5 months max
        principalAmount: loanDetails.principalAmount,
        tenureMonths: loanDetails.tenureMonths,
        interestRate: loanDetails.interestRate, // 0%
        interestType: loanDetails.interestType, // FLAT
        totalInterest: loanDetails.totalInterest, // 0
        totalRepayable: loanDetails.totalRepayable, // Same as principal
        monthlyInstallment: loanDetails.monthlyInstallment,
        status: 'DRAFT',
        createdById: data.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
      },
    });

    return {
      ...loan,
      eligibilityInfo: {
        monthlySalary,
        maxEligibleAmount: maxLoanAmount,
        monthlyDeductionPercentage: deductionValidation.percentageOfSalary.toFixed(2),
        businessRules: {
          maxTenureMonths: STAFF_LOAN_CONFIG.MAX_TENURE_MONTHS,
          interestRate: STAFF_LOAN_CONFIG.INTEREST_RATE,
          maxSalaryDeduction: `${STAFF_LOAN_CONFIG.MAX_SALARY_DEDUCTION_PERCENTAGE}%`,
        },
      },
    };
  }

  /**
   * Approve loan application
   */
  async approveLoan(
    loanId: string,
    approverId: string,
    data: {
      approvedAmount: number;
      approvedTenureMonths: number;
      interestRate: number;
      approvalNotes?: string;
    },
  ) {
    const loan = await this.prisma.staffLoan.findUnique({
      where: { id: loanId },
      include: { user: true },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.status !== 'PENDING_APPROVAL' && loan.status !== 'DRAFT') {
      throw new BadRequestException('Loan is not pending approval');
    }

    // Prevent self-approval
    if (loan.userId === approverId) {
      throw new BadRequestException('Self-approval is not allowed');
    }

    // Calculate loan terms
    const principalAmount = data.approvedAmount;
    const tenureMonths = data.approvedTenureMonths;
    const interestRate = data.interestRate;
    
    // Simple flat interest calculation
    const totalInterest = (principalAmount * interestRate * tenureMonths) / (100 * 12);
    const totalRepayable = principalAmount + totalInterest;
    const monthlyInstallment = totalRepayable / tenureMonths;

    const updated = await this.prisma.staffLoan.update({
      where: { id: loanId },
      data: {
        approvedAmount: principalAmount,
        principalAmount,
        tenureMonths,
        interestRate,
        interestType: 'FLAT',
        totalInterest,
        totalRepayable,
        monthlyInstallment,
        approvalNotes: data.approvalNotes,
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedById: approverId,
      },
    });

    return updated;
  }

  /**
   * Reject loan application
   */
  async rejectLoan(loanId: string, rejectorId: string, reason: string) {
    const loan = await this.prisma.staffLoan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Loan is not pending approval');
    }

    const updated = await this.prisma.staffLoan.update({
      where: { id: loanId },
      data: {
        status: 'REJECTED' as any,
        reviewedAt: new Date(),
        reviewedById: rejectorId,
        rejectionReason: reason,
      },
    });

    return updated;
  }

  /**
   * Disburse approved loan
   */
  async disburseLoan(
    loanId: string,
    disburserId: string,
    data: {
      disbursementDate: Date;
      disbursementMethod: string;
      referenceNumber?: string;
      notes?: string;
    },
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const loan = await tx.staffLoan.findUnique({
        where: { id: loanId },
      });

      if (!loan) {
        throw new NotFoundException('Loan not found');
      }

      if (loan.status !== 'APPROVED') {
        throw new BadRequestException('Loan is not approved for disbursement');
      }

      // Update loan
      await tx.staffLoan.update({
        where: { id: loanId },
        data: {
          disbursedAt: data.disbursementDate || new Date(),
          disbursementMethod: data.disbursementMethod,
          disbursementReference: data.referenceNumber,
          status: 'DISBURSED' as any,
          disbursedById: disburserId,
        },
      });

      // Generate repayment schedule
      await this.repaymentService.generateRepaymentSchedule(
        loanId,
        Number(loan.principalAmount),
        Number(loan.interestRate),
        loan.tenureMonths,
        data.disbursementDate,
      );

      return await tx.staffLoan.findUnique({
        where: { id: loanId },
        include: {
          repaymentSchedule: {
            orderBy: { installmentNumber: 'asc' },
          },
        },
      });
    });
  }

  /**
   * Get my staff loans
   */
  async getMyLoans(userId: string, status?: StaffLoanStatus) {
    const where: any = { userId };
    if (status) where.status = status;

    return await this.prisma.staffLoan.findMany({
      where,
      include: {
        repaymentSchedule: {
          orderBy: { installmentNumber: 'asc' },
        },
        _count: {
          select: {
            payments: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * Get loan details with full breakdown
   */
  async getLoanDetails(loanId: string) {
    const loan = await this.prisma.staffLoan.findUnique({
      where: { id: loanId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        disbursedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        repaymentSchedule: {
          orderBy: { installmentNumber: 'asc' },
        },
        payments: {
          include: {
            installment: true,
            recordedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    // Calculate outstanding balance
    const outstandingBalance = await this.repaymentService.calculateOutstandingBalance(
      loanId,
    );

    return {
      ...loan,
      outstandingBalance,
    };
  }

  /**
   * Get pending loan approvals
   */
  async getPendingApprovals() {
    return await this.prisma.staffLoan.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
            department: true,
            branch: true,
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  /**
   * Generate unique loan number
   */
  private async generateLoanNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.staffLoan.count({
      where: {
        loanNumber: { startsWith: `SL${year}` },
      },
    });
    return `SL${year}${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Check loan eligibility
   */
  async checkEligibility(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for active employment
    const employment = await this.prisma.employmentPeriod.findFirst({
      where: {
        userId,
        isCurrent: true,
        terminationDate: null, // Still employed
      },
    });

    // Check for active loans
    const activeLoans = await this.prisma.staffLoan.findMany({
      where: {
        userId,
        status: { in: ['ACTIVE', 'PENDING_APPROVAL', 'APPROVED'] },
      },
    });

    const hasActiveLoans = activeLoans.length > 0;
    const hasOverdue = await this.prisma.staffLoanInstallment.findFirst({
      where: {
        staffLoanId: { in: activeLoans.map(l => l.id) },
        status: 'OVERDUE' as any,
      },
    });

    // Calculate max eligible amount if employment exists
    let maxEligibleAmount = 0;
    let monthlySalary = 0;
    let maxMonthlyDeduction = 0;

    if (employment && employment.salary) {
      monthlySalary = Number(employment.salary);
      maxEligibleAmount = calculateMaxLoanAmount(monthlySalary);
      maxMonthlyDeduction = monthlySalary * (STAFF_LOAN_CONFIG.MAX_SALARY_DEDUCTION_PERCENTAGE / 100);
    }

    const isEligible =
      user.status === 'ACTIVE' &&
      employment !== null &&
      !hasActiveLoans &&
      !hasOverdue &&
      monthlySalary > 0;

    return {
      eligible: isEligible,
      reasons: {
        activeEmployment: employment !== null,
        accountActive: user.status === 'ACTIVE',
        noActiveLoans: !hasActiveLoans,
        noOverduePayments: !hasOverdue,
        hasValidSalary: monthlySalary > 0,
      },
      loanLimits: {
        monthlySalary,
        maxEligibleAmount,
        maxMonthlyDeduction,
        maxTenureMonths: STAFF_LOAN_CONFIG.MAX_TENURE_MONTHS,
        minLoanAmount: STAFF_LOAN_CONFIG.MIN_LOAN_AMOUNT,
      },
      businessRules: {
        interestRate: `${STAFF_LOAN_CONFIG.INTEREST_RATE}%`,
        maxRepaymentPeriod: `${STAFF_LOAN_CONFIG.MAX_TENURE_MONTHS} months`,
        maxSalaryDeduction: `${STAFF_LOAN_CONFIG.MAX_SALARY_DEDUCTION_PERCENTAGE}%`,
        description: 'Interest-free staff loans with maximum 5-month repayment period. Monthly deduction cannot exceed 25% of gross salary.',
      },
    };
  }
}
