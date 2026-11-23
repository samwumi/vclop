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
   * Get all active leave types
   */
  async getLeaveTypes() {
    return this.prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        defaultDaysPerYear: true,
        carryForwardAllowed: true,
        maxCarryForwardDays: true,
        requiresApproval: true,
        minNoticeDays: true,
        maxConsecutiveDays: true,
        allowHalfDay: true,
        countWeekendsAsLeave: true,
        countHolidaysAsLeave: true,
      },
    });
  }

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

  /* ═══════════════════════════════════════════════════════════════════════
   * HR MANAGEMENT METHODS
   * ═══════════════════════════════════════════════════════════════════════ */

  /**
   * Get all users' leave entitlements for a year (HR only)
   */
  async getAllEntitlements(year: number) {
    return await this.prisma.leaveEntitlement.findMany({
      where: { year },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            branch: { select: { name: true } },
          },
        },
        leaveType: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: [
        { user: { username: 'asc' } },
        { leaveType: { name: 'asc' } },
      ],
    });
  }

  /**
   * Update leave entitlement (HR only)
   */
  async updateEntitlement(
    entitlementId: string,
    data: { allocatedDays?: number; carryForwardDays?: number; adjustmentDays?: number; reason?: string },
    updatedById: string,
  ) {
    const entitlement = await this.prisma.leaveEntitlement.findUnique({
      where: { id: entitlementId },
    });

    if (!entitlement) {
      throw new NotFoundException('Leave entitlement not found');
    }

    const updated = await this.prisma.leaveEntitlement.update({
      where: { id: entitlementId },
      data: {
        ...(data.allocatedDays !== undefined && { allocatedDays: data.allocatedDays }),
        ...(data.carryForwardDays !== undefined && { carryForwardDays: data.carryForwardDays }),
        ...(data.adjustmentDays !== undefined && { adjustmentDays: data.adjustmentDays }),
        updatedById,
      },
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        leaveType: true,
      },
    });

    // Log adjustment if reason provided
    if (data.reason) {
      await this.prisma.leaveEntitlementAdjustment.create({
        data: {
          entitlementId,
          adjustmentDays: data.adjustmentDays || 0,
          reason: data.reason,
          approvedById: updatedById,
        },
      });
    }

    return updated;
  }

  /**
   * Add adjustment to leave entitlement (HR only)
   */
  async addAdjustment(
    entitlementId: string,
    data: { adjustmentDays: number; reason: string },
    approvedById: string,
  ) {
    const entitlement = await this.prisma.leaveEntitlement.findUnique({
      where: { id: entitlementId },
      include: { user: true, leaveType: true },
    });

    if (!entitlement) {
      throw new NotFoundException('Leave entitlement not found');
    }

    // Create adjustment record
    const adjustment = await this.prisma.leaveEntitlementAdjustment.create({
      data: {
        entitlementId,
        adjustmentDays: data.adjustmentDays,
        reason: data.reason,
        approvedById,
      },
      include: {
        approvedBy: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update entitlement's total adjustment
    const newAdjustment = Number(entitlement.adjustmentDays) + data.adjustmentDays;
    await this.prisma.leaveEntitlement.update({
      where: { id: entitlementId },
      data: {
        adjustmentDays: newAdjustment,
        updatedById: approvedById,
      },
    });

    return {
      adjustment,
      newTotal: newAdjustment,
      entitlement: {
        user: entitlement.user,
        leaveType: entitlement.leaveType,
      },
    };
  }

  /**
   * Get adjustment history for an entitlement (HR only)
   */
  async getAdjustmentHistory(entitlementId: string) {
    return await this.prisma.leaveEntitlementAdjustment.findMany({
      where: { entitlementId },
      include: {
        approvedBy: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}