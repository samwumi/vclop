import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { OffboardingStatus, ClearanceStatus } from '@prisma/client';

@Injectable()
export class OffboardingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initiate offboarding process
   */
  async initiateOffboarding(data: {
    userId: string;
    exitDate: Date;
    exitReason: string;
    isVoluntary: boolean;
    initiatedById: string;
    notes?: string;
  }) {
    // Check if user has active employment
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

    const currentEmployment = employmentPeriods[0];
    if (!currentEmployment) {
      throw new BadRequestException('No active employment found');
    }

    // Check for existing offboarding
    const existingOffboarding = await this.prisma.offboardingCase.findMany({
      where: {
        userId: data.userId,
        overallStatus: { in: ['IN_PROGRESS'] },
      },
    });

    if (existingOffboarding.length > 0) {
      throw new BadRequestException('Offboarding already in progress');
    }

    // Generate case number
    const caseNumber = await this.generateCaseNumber();

    // Create offboarding record
    const offboarding = await this.prisma.offboardingCase.create({
      data: {
        caseNumber,
        userId: data.userId,
        employmentPeriodId: currentEmployment.id,
        expectedLastWorkingDay: data.exitDate,
        initiatedById: data.initiatedById,
        initiatedAt: new Date(),
        overallStatus: 'IN_PROGRESS',
        itAccessStatus: 'PENDING',
        financeStatus: 'PENDING',
        assetStatus: 'PENDING',
        hrStatus: 'PENDING',
        handoverStatus: 'PENDING',
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
        initiatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return offboarding;
  }

  /**
   * Revoke IT access (immediate & independent)
   */
  async revokeITAccess(
    offboardingId: string,
    revokedById: string,
    data: {
      revocationNotes?: string;
      accountsDisabled?: string[];
      sessionTerminated?: boolean;
    },
  ) {
    const offboarding = await this.prisma.offboardingCase.findUnique({
      where: { id: offboardingId },
      include: { user: true },
    });

    if (!offboarding) {
      throw new NotFoundException('Offboarding case not found');
    }

    if (offboarding.itAccessStatus === 'CLEARED') {
      throw new BadRequestException('IT access already revoked');
    }

    // Update offboarding
    const updated = await this.prisma.offboardingCase.update({
      where: { id: offboardingId },
      data: {
        itAccessStatus: 'CLEARED',
        itAccessRevokedAt: new Date(),
        itAccessRevokedById: revokedById,
        itAccessNotes: data.revocationNotes,
        overallStatus: 'IN_PROGRESS',
      },
    });

    // TODO: Suspend user account
    await this.prisma.user.update({
      where: { id: offboarding.userId },
      data: { status: 'SUSPENDED' },
    });

    return updated;
  }

  /**
   * Process finance clearance
   */
  async processFinanceClearance(
    offboardingId: string,
    clearedById: string,
    data: {
      isCleared: boolean;
      outstandingAmount?: number;
      clearanceNotes?: string;
    },
  ) {
    const offboarding = await this.prisma.offboardingCase.findUnique({
      where: { id: offboardingId },
      include: {
        user: {
          include: {
            staffLoans: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!offboarding) {
      throw new NotFoundException('Offboarding case not found');
    }

    if (offboarding.financeClearedAt !== null) {
      throw new BadRequestException('Finance clearance already processed');
    }

    // Check for outstanding loans
    const activeLoans = offboarding.user.staffLoans.filter(
      (loan) => loan.status === 'ACTIVE' || loan.status === 'DISBURSED'
    );
    
    if (activeLoans.length > 0 && data.isCleared) {
      throw new BadRequestException('Cannot clear with active staff loans');
    }

    const outstandingAmount = activeLoans.reduce(
      (sum, loan) => sum + Number(loan.totalRepayable),
      0
    );

    const updated = await this.prisma.offboardingCase.update({
      where: { id: offboardingId },
      data: {
        financeStatus: data.isCleared ? 'CLEARED' : 'BLOCKED',
        financeClearedAt: new Date(),
        financeClearedById: clearedById,
        outstandingStaffLoans: outstandingAmount,
        financeNotes: data.clearanceNotes,
        overallStatus: 'IN_PROGRESS',
      },
    });

    await this.checkCompletionStatus(offboardingId);

    return updated;
  }

  /**
   * Process asset clearance
   */
  async processAssetClearance(
    offboardingId: string,
    clearedById: string,
    data: {
      isCleared: boolean;
      clearanceNotes?: string;
      outstandingItems?: string;
    },
  ) {
    const offboarding = await this.prisma.offboardingCase.findUnique({
      where: { id: offboardingId },
    });

    if (!offboarding) {
      throw new NotFoundException('Offboarding case not found');
    }

    if (offboarding.assetsClearedAt !== null) {
      throw new BadRequestException('Asset clearance already processed');
    }

    const updated = await this.prisma.offboardingCase.update({
      where: { id: offboardingId },
      data: {
        assetStatus: data.isCleared ? 'CLEARED' : 'BLOCKED',
        assetsClearedAt: new Date(),
        assetsClearedById: clearedById,
        assetNotes: data.clearanceNotes,
        overallStatus: 'IN_PROGRESS',
      },
    });

    await this.checkCompletionStatus(offboardingId);

    return updated;
  }

  /**
   * Process HR clearance
   */
  async processHRClearance(
    offboardingId: string,
    clearedById: string,
    data: {
      isCleared: boolean;
      clearanceNotes?: string;
      exitInterviewCompleted?: boolean;
    },
  ) {
    const offboarding = await this.prisma.offboardingCase.findUnique({
      where: { id: offboardingId },
    });

    if (!offboarding) {
      throw new NotFoundException('Offboarding case not found');
    }

    if (offboarding.hrClearedAt !== null) {
      throw new BadRequestException('HR clearance already processed');
    }

    const updated = await this.prisma.offboardingCase.update({
      where: { id: offboardingId },
      data: {
        hrStatus: data.isCleared ? 'CLEARED' : 'BLOCKED',
        hrClearedAt: new Date(),
        hrClearedById: clearedById,
        hrNotes: data.clearanceNotes,
        exitInterviewCompleted: data.exitInterviewCompleted || false,
        overallStatus: 'IN_PROGRESS',
      },
    });

    await this.checkCompletionStatus(offboardingId);

    return updated;
  }

  /**
   * Check if all clearances are complete
   */
  private async checkCompletionStatus(offboardingId: string) {
    const offboarding = await this.prisma.offboardingCase.findUnique({
      where: { id: offboardingId },
    });

    if (!offboarding) {
      return;
    }

    // Check if all clearances are done
    const allCleared =
      offboarding.itAccessStatus === 'CLEARED' &&
      offboarding.financeStatus === 'CLEARED' &&
      offboarding.assetStatus === 'CLEARED' &&
      offboarding.hrStatus === 'CLEARED';

    if (allCleared && offboarding.overallStatus !== 'COMPLETED') {
      await this.completeOffboarding(offboardingId);
    }
  }

  /**
   * Complete offboarding
   */
  async completeOffboarding(offboardingId: string) {
    const offboarding = await this.prisma.offboardingCase.findUnique({
      where: { id: offboardingId },
      include: { employmentPeriod: true },
    });

    if (!offboarding) {
      throw new NotFoundException('Offboarding case not found');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Close employment period
      await tx.employmentPeriod.update({
        where: { id: offboarding.employmentPeriodId },
        data: {
          terminationDate: offboarding.expectedLastWorkingDay,
          isCurrent: false,
        },
      });

      // Update offboarding status
      await tx.offboardingCase.update({
        where: { id: offboardingId },
        data: {
          overallStatus: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Update user status to inactive
      await tx.user.update({
        where: { id: offboarding.userId },
        data: { status: 'INACTIVE' },
      });

      // Expire all active delegations
      await tx.resourceDelegation.updateMany({
        where: {
          OR: [
            { delegatedFrom: offboarding.userId },
            { delegatedTo: offboarding.userId },
          ],
          status: 'ACTIVE',
        },
        data: { status: 'EXPIRED' },
      });

      return offboarding;
    });
  }

  /**
   * Get offboarding cases
   */
  async getOffboardingCases(status?: OffboardingStatus) {
    const where: any = {};
    if (status) where.status = status;

    return await this.prisma.offboardingCase.findMany({
      where,
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
        initiatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { initiatedAt: 'desc' },
    });
  }

  /**
   * Get offboarding details
   */
  async getOffboardingDetails(offboardingId: string) {
    const offboarding = await this.prisma.offboardingCase.findUnique({
      where: { id: offboardingId },
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
        employmentPeriod: true,
        initiatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        itAccessRevokedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        financeClearedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assetsClearedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        hrClearedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!offboarding) {
      throw new NotFoundException('Offboarding case not found');
    }

    // Get outstanding staff loans
    const outstandingLoans = await this.prisma.staffLoan.findMany({
      where: {
        userId: offboarding.userId,
        status: 'ACTIVE',
      },
      include: {
        repaymentSchedule: {
          where: { status: { in: ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'] } },
        },
      },
    });

    // Get resource ownerships to be reassigned
    const resources = await this.prisma.resourceOwnership.findMany({
      where: {
        ownerId: offboarding.userId,
        effectiveTo: null,
      },
    });

    return {
      ...offboarding,
      outstandingLoans,
      resourcesToReassign: resources,
    };
  }

  /**
   * Generate unique case number
   */
  private async generateCaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.offboardingCase.count({
      where: {
        caseNumber: { startsWith: `OFF${year}` },
      },
    });
    return `OFF${year}${String(count + 1).padStart(6, '0')}`;
  }
}
