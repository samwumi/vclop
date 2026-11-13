import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DayType } from '@prisma/client';

interface LeaveBalance {
  totalEntitled: number;
  daysUsed: number;
  daysPending: number;
  daysAvailable: number;
  usedApplicationsCount: number;
  pendingApplicationsCount: number;
}

@Injectable()
export class LeaveBalanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate leave balance from LeaveApplication records
   * SOURCE OF TRUTH: LeaveApplication table (no stored computed fields)
   */
  async calculateLeaveBalance(
    userId: string,
    leaveTypeId: string,
    year: number,
  ): Promise<LeaveBalance> {
    // 1. Get entitlement configuration
    const entitlement = await this.prisma.leaveEntitlement.findUnique({
      where: {
        userId_leaveTypeId_year: { userId, leaveTypeId, year },
      },
      include: { leaveType: true },
    });

    if (!entitlement) {
      return {
        totalEntitled: 0,
        daysUsed: 0,
        daysPending: 0,
        daysAvailable: 0,
        usedApplicationsCount: 0,
        pendingApplicationsCount: 0,
      };
    }

    const totalEntitled =
      Number(entitlement.allocatedDays) +
      Number(entitlement.carryForwardDays) +
      Number(entitlement.adjustmentDays);

    // 2. Calculate used days (APPROVED + ACTIVE + COMPLETED)
    const usedApplications = await this.prisma.leaveApplication.findMany({
      where: {
        userId,
        leaveTypeId,
        primaryEntitlementYear: year,
        status: { in: ['APPROVED', 'ACTIVE', 'COMPLETED'] },
      },
    });

    const daysUsed = usedApplications.reduce((sum, app) => {
      const days = app.daysFromPrimaryYear
        ? Number(app.daysFromPrimaryYear)
        : Number(app.businessDaysRequested);
      return sum + days;
    }, 0);

    // 3. Calculate pending days (DRAFT + PENDING_APPROVAL)
    const pendingApplications = await this.prisma.leaveApplication.findMany({
      where: {
        userId,
        leaveTypeId,
        primaryEntitlementYear: year,
        status: { in: ['DRAFT', 'PENDING_APPROVAL'] },
      },
    });

    const daysPending = pendingApplications.reduce((sum, app) => {
      const days = app.daysFromPrimaryYear
        ? Number(app.daysFromPrimaryYear)
        : Number(app.businessDaysRequested);
      return sum + days;
    }, 0);

    // 4. Calculate available
    const daysAvailable = totalEntitled - daysUsed - daysPending;

    return {
      totalEntitled,
      daysUsed,
      daysPending,
      daysAvailable,
      usedApplicationsCount: usedApplications.length,
      pendingApplicationsCount: pendingApplications.length,
    };
  }

  /**
   * Calculate business days excluding weekends/holidays
   */
  async calculateBusinessDays(
    startDate: Date,
    endDate: Date,
    startDayType: DayType,
    endDayType: DayType,
    userId: string,
    leaveTypeId: string,
  ): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { branch: true },
    });

    const leaveType = await this.prisma.leaveType.findUnique({
      where: { id: leaveTypeId },
    });

    if (!user || !leaveType) {
      throw new NotFoundException('User or leave type not found');
    }

    // Get branch workweek configuration
    const workweek = await this.prisma.branchWorkweek.findFirst({
      where: {
        branchId: user.branchId,
        effectiveFrom: { lte: startDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: startDate } }],
      },
    });

    // Get public holidays in date range for this branch
    const holidays = await this.prisma.publicHoliday.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        OR: [{ branchId: user.branchId }, { branchId: null }],
      },
    });

    const holidayDates = new Set(
      holidays.map((h) => h.date.toISOString().split('T')[0]),
    );

    let businessDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday
      const dateStr = currentDate.toISOString().split('T')[0];

      // Check if it's a weekend
      const isWeekend = !this.isWorkday(dayOfWeek, workweek);
      const isHoliday = holidayDates.has(dateStr);

      // Count day based on leave type configuration
      const countThisDay =
        (isWeekend && leaveType.countWeekendsAsLeave) ||
        (isHoliday && leaveType.countHolidaysAsLeave) ||
        (!isWeekend && !isHoliday);

      if (countThisDay) {
        // Handle half days
        if (
          currentDate.toDateString() === startDate.toDateString() &&
          startDayType !== 'FULL_DAY'
        ) {
          businessDays += 0.5;
        } else if (
          currentDate.toDateString() === endDate.toDateString() &&
          endDayType !== 'FULL_DAY'
        ) {
          businessDays += 0.5;
        } else {
          businessDays += 1.0;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return businessDays;
  }

  /**
   * Check if a day of week is a workday
   */
  private isWorkday(dayOfWeek: number, workweek: any): boolean {
    if (!workweek) {
      // Default: Monday-Friday
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    }

    const workdayMap: Record<number, boolean> = {
      0: workweek.isSundayWorkday,
      1: workweek.isMondayWorkday,
      2: workweek.isTuesdayWorkday,
      3: workweek.isWednesdayWorkday,
      4: workweek.isThursdayWorkday,
      5: workweek.isFridayWorkday,
      6: workweek.isSaturdayWorkday,
    };

    return workdayMap[dayOfWeek] || false;
  }

  /**
   * Calculate year split for leave spanning multiple years
   */
  async calculateYearSplit(
    startDate: Date,
    endDate: Date,
    businessDaysTotal: number,
    userId: string,
    leaveTypeId: string,
  ): Promise<{
    primaryYear: number;
    secondaryYear: number | null;
    primaryDays: number;
    secondaryDays: number | null;
  }> {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    if (startYear === endYear) {
      return {
        primaryYear: startYear,
        secondaryYear: null,
        primaryDays: businessDaysTotal,
        secondaryDays: null,
      };
    }

    // Calculate days in each year
    const yearEnd = new Date(startYear, 11, 31);

    const daysInFirstYear = await this.calculateBusinessDays(
      startDate,
      yearEnd,
      'FULL_DAY',
      'FULL_DAY',
      userId,
      leaveTypeId,
    );

    const daysInSecondYear = businessDaysTotal - daysInFirstYear;

    return {
      primaryYear: startYear,
      secondaryYear: endYear,
      primaryDays: daysInFirstYear,
      secondaryDays: daysInSecondYear,
    };
  }

  /**
   * Get all balances for a user in a year
   */
  async getAllBalances(userId: string, year: number) {
    const entitlements = await this.prisma.leaveEntitlement.findMany({
      where: { userId, year },
      include: { leaveType: true },
    });

    const balances = await Promise.all(
      entitlements.map(async (entitlement) => {
        const balance = await this.calculateLeaveBalance(
          userId,
          entitlement.leaveTypeId,
          year,
        );

        return {
          leaveType: entitlement.leaveType,
          ...balance,
        };
      }),
    );

    return balances;
  }
}
