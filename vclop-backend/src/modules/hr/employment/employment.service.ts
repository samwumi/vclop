import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ContractType, TerminationType } from '@prisma/client';

@Injectable()
export class EmploymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get employment history for a user
   */
  async getEmploymentHistory(userId: string) {
    const periods = await this.prisma.employmentPeriod.findMany({
      where: { userId },
      include: {
        department: true,
        branch: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        offboarding: {
          select: {
            id: true,
            caseNumber: true,
            overallStatus: true,
          },
        },
      },
      orderBy: { periodNumber: 'desc' },
    });

    return periods;
  }

  /**
   * Get guarantors for employment period
   */
  async getGuarantors(employmentPeriodId: string) {
    return await this.prisma.employeeGuarantor.findMany({
      where: { employmentPeriodId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Create guarantor
   */
  async createGuarantor(data: {
    employmentPeriodId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    relationship: string;
    address?: string;
    occupation?: string;
  }) {
    return await this.prisma.employeeGuarantor.create({
      data,
    });
  }

  /**
   * Update guarantor
   */
  async updateGuarantor(
    guarantorId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      relationship?: string;
      address?: string;
      occupation?: string;
    },
  ) {
    return await this.prisma.employeeGuarantor.update({
      where: { id: guarantorId },
      data,
    });
  }

  /**
   * Delete guarantor
   */
  async deleteGuarantor(guarantorId: string) {
    return await this.prisma.employeeGuarantor.delete({
      where: { id: guarantorId },
    });
  }

  /**
   * Get next of kin for employment period
   */
  async getNextOfKin(employmentPeriodId: string) {
    return await this.prisma.employeeNextOfKin.findMany({
      where: { employmentPeriodId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Create next of kin
   */
  async createNextOfKin(data: {
    employmentPeriodId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    relationship: string;
    address?: string;
    isPrimary?: boolean;
  }) {
    // If setting as primary, unset other primary entries
    if (data.isPrimary) {
      await this.prisma.employeeNextOfKin.updateMany({
        where: {
          employmentPeriodId: data.employmentPeriodId,
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    return await this.prisma.employeeNextOfKin.create({
      data,
    });
  }

  /**
   * Update next of kin
   */
  async updateNextOfKin(
    nextOfKinId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      relationship?: string;
      address?: string;
      isPrimary?: boolean;
    },
  ) {
    // If setting as primary, get the record first to unset others
    if (data.isPrimary) {
      const record = await this.prisma.employeeNextOfKin.findUnique({
        where: { id: nextOfKinId },
      });

      if (record) {
        await this.prisma.employeeNextOfKin.updateMany({
          where: {
            employmentPeriodId: record.employmentPeriodId,
            isPrimary: true,
            id: { not: nextOfKinId },
          },
          data: { isPrimary: false },
        });
      }
    }

    return await this.prisma.employeeNextOfKin.update({
      where: { id: nextOfKinId },
      data,
    });
  }

  /**
   * Delete next of kin
   */
  async deleteNextOfKin(nextOfKinId: string) {
    return await this.prisma.employeeNextOfKin.delete({
      where: { id: nextOfKinId },
    });
  }

  /**
   * Get current employment period
   */
  async getCurrentEmployment(userId: string) {
    const current = await this.prisma.employmentPeriod.findFirst({
      where: {
        userId,
        isCurrent: true,
      },
      include: {
        department: true,
        branch: true,
      },
    });

    if (!current) {
      throw new NotFoundException(`No current employment found for user ${userId}`);
    }

    return current;
  }

  /**
   * Create initial employment period
   */
  async createEmploymentPeriod(data: {
    userId: string;
    hireDate: Date;
    jobTitle: string;
    departmentId: string;
    branchId: string;
    contractType: ContractType;
    salary?: number;
    createdById: string;
  }) {
    // Check if user already has a current employment period
    const existing = await this.prisma.employmentPeriod.findFirst({
      where: {
        userId: data.userId,
        isCurrent: true,
      },
    });

    if (existing) {
      throw new BadRequestException('User already has an active employment period');
    }

    // Get next period number
    const lastPeriod = await this.prisma.employmentPeriod.findFirst({
      where: { userId: data.userId },
      orderBy: { periodNumber: 'desc' },
    });

    const periodNumber = lastPeriod ? lastPeriod.periodNumber + 1 : 1;

    // Create employment period
    const period = await this.prisma.employmentPeriod.create({
      data: {
        userId: data.userId,
        periodNumber,
        hireDate: data.hireDate,
        jobTitle: data.jobTitle,
        departmentId: data.departmentId,
        branchId: data.branchId,
        contractType: data.contractType,
        salary: data.salary,
        salaryEffectiveDate: data.salary ? data.hireDate : null,
        isCurrent: true,
        createdById: data.createdById,
      },
      include: {
        department: true,
        branch: true,
      },
    });

    // Update user record
    await this.prisma.user.update({
      where: { id: data.userId },
      data: {
        jobTitle: data.jobTitle,
        departmentId: data.departmentId,
        branchId: data.branchId,
        status: 'ACTIVE',
      },
    });

    return period;
  }

  /**
   * Update salary
   */
  async updateSalary(
    employmentPeriodId: string,
    newSalary: number,
    effectiveDate: Date,
    updatedById: string,
  ) {
    const period = await this.prisma.employmentPeriod.findUnique({
      where: { id: employmentPeriodId },
    });

    if (!period) {
      throw new NotFoundException('Employment period not found');
    }

    if (!period.isCurrent) {
      throw new BadRequestException('Cannot update salary for past employment period');
    }

    return await this.prisma.employmentPeriod.update({
      where: { id: employmentPeriodId },
      data: {
        salary: newSalary,
        salaryEffectiveDate: effectiveDate,
      },
    });
  }

  /**
   * Transfer employee to different branch/department
   */
  async transferEmployee(data: {
    userId: string;
    newDepartmentId?: string;
    newBranchId?: string;
    effectiveDate: Date;
    updatedById: string;
  }) {
    const current = await this.getCurrentEmployment(data.userId);

    const updateData: any = {};
    if (data.newDepartmentId) updateData.departmentId = data.newDepartmentId;
    if (data.newBranchId) updateData.branchId = data.newBranchId;

    const updated = await this.prisma.employmentPeriod.update({
      where: { id: current.id },
      data: updateData,
      include: {
        department: true,
        branch: true,
      },
    });

    // Also update user record
    await this.prisma.user.update({
      where: { id: data.userId },
      data: updateData,
    });

    return updated;
  }

  /**
   * Check if user is eligible for rehire
   */
  async checkRehireEligibility(userId: string) {
    const lastPeriod = await this.prisma.employmentPeriod.findFirst({
      where: { userId },
      orderBy: { periodNumber: 'desc' },
    });

    if (!lastPeriod) {
      return { eligible: true, reason: 'No previous employment' };
    }

    if (lastPeriod.isCurrent) {
      return { eligible: false, reason: 'Currently employed' };
    }

    if (!lastPeriod.rehireEligible) {
      return {
        eligible: false,
        reason: lastPeriod.terminationReason || 'Marked not eligible for rehire',
      };
    }

    return { eligible: true, reason: null };
  }

  /**
   * Rehire employee (create new employment period)
   */
  async rehireEmployee(data: {
    userId: string;
    hireDate: Date;
    jobTitle: string;
    departmentId: string;
    branchId: string;
    contractType: ContractType;
    salary?: number;
    createdById: string;
  }) {
    // Check eligibility
    const eligibility = await this.checkRehireEligibility(data.userId);
    if (!eligibility.eligible) {
      throw new BadRequestException(`Cannot rehire: ${eligibility.reason}`);
    }

    // Create new employment period (reuse createEmploymentPeriod logic)
    return await this.createEmploymentPeriod(data);
  }
}

  /**
   * Submit employment data for HR review
   */
  async submitEmploymentForReview(userId: string) {
    const currentEmployment = await this.prisma.employmentPeriod.findFirst({
      where: {
        userId,
        isCurrent: true,
      },
    });

    if (!currentEmployment) {
      throw new NotFoundException('No current employment found');
    }

    if (currentEmployment.submissionStatus !== 'DRAFT' && currentEmployment.submissionStatus !== 'NEEDS_REVISION') {
      throw new BadRequestException(`Cannot submit - current status is ${currentEmployment.submissionStatus}`);
    }

    // Validate: must have at least one guarantor
    const guarantorCount = await this.prisma.employeeGuarantor.count({
      where: { employmentPeriodId: currentEmployment.id },
    });

    if (guarantorCount === 0) {
      throw new BadRequestException('You must add at least one guarantor before submitting');
    }

    // Validate: must have at least one next of kin
    const nokCount = await this.prisma.employeeNextOfKin.count({
      where: { employmentPeriodId: currentEmployment.id },
    });

    if (nokCount === 0) {
      throw new BadRequestException('You must add at least one next of kin before submitting');
    }

    // Update employment period
    return await this.prisma.employmentPeriod.update({
      where: { id: currentEmployment.id },
      data: {
        submissionStatus: 'SUBMITTED',
        submittedAt: new Date(),
        isEditable: false,
      },
    });
  }

  /**
   * Get pending submissions for HR review
   */
  async getPendingSubmissions() {
    return await this.prisma.employmentPeriod.findMany({
      where: {
        submissionStatus: {
          in: ['SUBMITTED', 'UNDER_REVIEW'],
        },
        isCurrent: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: true,
        branch: true,
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  /**
   * Approve employment submission
   */
  async approveEmployment(userId: string, reviewerId: string, reviewNotes?: string) {
    const currentEmployment = await this.prisma.employmentPeriod.findFirst({
      where: {
        userId,
        isCurrent: true,
      },
    });

    if (!currentEmployment) {
      throw new NotFoundException('No current employment found');
    }

    if (currentEmployment.submissionStatus !== 'SUBMITTED' && currentEmployment.submissionStatus !== 'UNDER_REVIEW') {
      throw new BadRequestException(`Cannot approve - current status is ${currentEmployment.submissionStatus}`);
    }

    return await this.prisma.employmentPeriod.update({
      where: { id: currentEmployment.id },
      data: {
        submissionStatus: 'APPROVED',
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        reviewNotes,
        isEditable: false,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Reject employment submission
   */
  async rejectEmployment(userId: string, reviewerId: string, reviewNotes: string) {
    if (!reviewNotes) {
      throw new BadRequestException('Review notes are required when rejecting');
    }

    const currentEmployment = await this.prisma.employmentPeriod.findFirst({
      where: {
        userId,
        isCurrent: true,
      },
    });

    if (!currentEmployment) {
      throw new NotFoundException('No current employment found');
    }

    if (currentEmployment.submissionStatus !== 'SUBMITTED' && currentEmployment.submissionStatus !== 'UNDER_REVIEW') {
      throw new BadRequestException(`Cannot reject - current status is ${currentEmployment.submissionStatus}`);
    }

    return await this.prisma.employmentPeriod.update({
      where: { id: currentEmployment.id },
      data: {
        submissionStatus: 'REJECTED',
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        reviewNotes,
        isEditable: false,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Request revision on employment submission
   */
  async requestRevision(userId: string, reviewerId: string, reviewNotes: string) {
    if (!reviewNotes) {
      throw new BadRequestException('Review notes are required when requesting revision');
    }

    const currentEmployment = await this.prisma.employmentPeriod.findFirst({
      where: {
        userId,
        isCurrent: true,
      },
    });

    if (!currentEmployment) {
      throw new NotFoundException('No current employment found');
    }

    if (currentEmployment.submissionStatus !== 'SUBMITTED' && currentEmployment.submissionStatus !== 'UNDER_REVIEW') {
      throw new BadRequestException(`Cannot request revision - current status is ${currentEmployment.submissionStatus}`);
    }

    return await this.prisma.employmentPeriod.update({
      where: { id: currentEmployment.id },
      data: {
        submissionStatus: 'NEEDS_REVISION',
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        reviewNotes,
        isEditable: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Grant edit rights to approved employment
   */
  async grantEditRights(userId: string, grantedById: string) {
    const currentEmployment = await this.prisma.employmentPeriod.findFirst({
      where: {
        userId,
        isCurrent: true,
      },
    });

    if (!currentEmployment) {
      throw new NotFoundException('No current employment found');
    }

    if (currentEmployment.submissionStatus !== 'APPROVED') {
      throw new BadRequestException('Can only grant edit rights to approved records');
    }

    return await this.prisma.employmentPeriod.update({
      where: { id: currentEmployment.id },
      data: {
        isEditable: true,
        reviewNotes: `Edit rights granted by HR on ${new Date().toISOString()}`,
      },
    });
  }

  /**
   * Revoke edit rights from approved employment
   */
  async revokeEditRights(userId: string, revokedById: string) {
    const currentEmployment = await this.prisma.employmentPeriod.findFirst({
      where: {
        userId,
        isCurrent: true,
      },
    });

    if (!currentEmployment) {
      throw new NotFoundException('No current employment found');
    }

    if (currentEmployment.submissionStatus !== 'APPROVED') {
      throw new BadRequestException('Can only revoke edit rights from approved records');
    }

    return await this.prisma.employmentPeriod.update({
      where: { id: currentEmployment.id },
      data: {
        isEditable: false,
        reviewNotes: `Edit rights revoked by HR on ${new Date().toISOString()}`,
      },
    });
  }

  /**
   * Check if user can edit employment data
   */
  async canEditEmployment(userId: string): Promise<boolean> {
    const currentEmployment = await this.prisma.employmentPeriod.findFirst({
      where: {
        userId,
        isCurrent: true,
      },
    });

    if (!currentEmployment) {
      return true; // Can create new
    }

    return currentEmployment.isEditable;
  }
