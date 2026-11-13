import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LeaveBalanceService } from './leave-balance.service';
import { DayType, LeaveStatus } from '@prisma/client';

@Injectable()
export class LeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leaveBalanceService: LeaveBalanceService,
  ) {}

  /**
   * Create leave application (draft)
   */
  async createLeaveApplication(data: {
    userId: string;
    leaveTypeId: string;
    startDate: Date;
    endDate: Date;
    startDayType?: DayType;
    endDayType?: DayType;
    reason: string;
    handoverNotes?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }) {
    // Calculate business days
    const businessDays = await this.leaveBalanceService.calculateBusinessDays(
      data.startDate,
      data.endDate,
      data.startDayType || 'FULL_DAY',
      data.endDayType || 'FULL_DAY',
      data.userId,
      data.leaveTypeId,
    );

    // Calculate year split
    const yearSplit = await this.leaveBalanceService.calculateYearSplit(
      data.startDate,
      data.endDate,
      businessDays,
      data.userId,
      data.leaveTypeId,
    );

    // Generate application number
    const applicationNumber = await this.generateApplicationNumber();

    const application = await this.prisma.leaveApplication.create({
      data: {
        applicationNumber,
        userId: data.userId,
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        startDayType: data.startDayType || 'FULL_DAY',
        endDayType: data.endDayType || 'FULL_DAY',
        businessDaysRequested: businessDays,
        primaryEntitlementYear: yearSplit.primaryYear,
        secondaryEntitlementYear: yearSplit.secondaryYear,
        daysFromPrimaryYear: yearSplit.primaryDays,
        daysFromSecondaryYear: yearSplit.secondaryDays,
        reason: data.reason,
        handoverNotes: data.handoverNotes,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        status: 'DRAFT',
      },
      include: {
        leaveType: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            branch: true,
          },
        },
      },
    });

    return application;
  }

  /**
   * Submit leave application (with concurrency protection)
   */
  async submitLeaveApplication(applicationId: string, userId: string) {
    return await this.prisma.$transaction(
      async (tx) => {
        const application = await tx.leaveApplication.findUnique({
          where: { id: applicationId },
          include: { leaveType: true },
        });

        if (!application) {
          throw new NotFoundException('Leave application not found');
        }

        if (application.userId !== userId) {
          throw new BadRequestException('Unauthorized');
        }

        if (application.status !== 'DRAFT') {
          throw new BadRequestException('Application already submitted');
        }

        // Recalculate balance within transaction
        const balance = await this.leaveBalanceService.calculateLeaveBalance(
          application.userId,
          application.leaveTypeId,
          application.primaryEntitlementYear,
        );

        // Validate sufficient balance
        if (balance.daysAvailable < Number(application.businessDaysRequested)) {
          throw new BadRequestException(
            `Insufficient leave balance. Available: ${balance.daysAvailable}, Requested: ${application.businessDaysRequested}`,
          );
        }

        // Update status (reserves entitlement implicitly)
        const updated = await tx.leaveApplication.update({
          where: { id: applicationId },
          data: {
            status: 'PENDING_APPROVAL',
            submittedAt: new Date(),
            submittedById: userId,
          },
          include: {
            leaveType: true,
            user: true,
          },
        });

        return updated;
      },
      {
        isolationLevel: 'Serializable', // Prevent concurrent submissions
      },
    );
  }

  /**
   * Cancel leave application
   */
  async cancelLeaveApplication(
    applicationId: string,
    userId: string,
    reason: string,
  ) {
    const application = await this.prisma.leaveApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Leave application not found');
    }

    if (application.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    // Can only cancel DRAFT, PENDING_APPROVAL, or APPROVED (not started)
    if (!['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(application.status)) {
      throw new BadRequestException('Cannot cancel leave in current status');
    }

    const updated = await this.prisma.leaveApplication.update({
      where: { id: applicationId },
      data: {
        status: 'CANCELLED',
        cancelledById: userId,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    // Revoke any delegations if leave was approved
    if (application.status === 'APPROVED') {
      await this.prisma.resourceDelegation.updateMany({
        where: {
          relatedLeaveId: applicationId,
          status: 'ACTIVE',
        },
        data: { status: 'REVOKED' },
      });
    }

    return updated;
  }

  /**
   * Get my leave applications
   */
  async getMyApplications(userId: string, status?: LeaveStatus) {
    const where: any = { userId };
    if (status) where.status = status;

    return await this.prisma.leaveApplication.findMany({
      where,
      include: {
        leaveType: true,
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get my leave balance
   */
  async getMyBalance(userId: string, year: number) {
    return await this.leaveBalanceService.getAllBalances(userId, year);
  }

  /**
   * Generate unique application number
   */
  private async generateApplicationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.leaveApplication.count({
      where: {
        applicationNumber: { startsWith: `LA${year}` },
      },
    });
    return `LA${year}${String(count + 1).padStart(6, '0')}`;
  }
}
