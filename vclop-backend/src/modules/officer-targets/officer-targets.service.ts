import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { BusinessException } from '../../common/exceptions/app.exceptions';
import { SetTargetDto, QueryTargetsDto } from './dto/officer-target.dto';

@Injectable()
export class OfficerTargetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryTargetsDto, actor: RequestUser) {
    const isAdmin = actor.permissions.has('system:admin');
    const canManageUsers = actor.permissions.has('users:manage');

    const where: any = {};

    // Filter by userId if provided
    if (query.userId) {
      where.userId = query.userId;
    }

    // Filter by month if provided
    if (query.month) {
      const targetDate = this.parseMonth(query.month);
      where.targetMonth = targetDate;
    }

    // Non-admins can only see targets for their branch
    if (!isAdmin && !canManageUsers && actor.branchId) {
      where.user = { branchId: actor.branchId };
    }

    // Filter by branch if provided
    if (query.branchId) {
      where.user = { branchId: query.branchId };
    }

    const targets = await this.prisma.officerTarget.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            branchId: true,
            branch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: [
        { targetMonth: 'desc' },
        { user: { firstName: 'asc' } } as any,
      ],
    });

    // Calculate achievements dynamically from actual disbursements
    const enrichedTargets = await Promise.all(
      targets.map(async (t: any) => {
        const monthStart = new Date(t.targetMonth);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        // Calculate actual disbursements for customers this officer registered
        const disbursementAchieved = await this.prisma.loan.aggregate({
          where: {
            loanApplication: {
              customer: {
                createdById: t.userId,
              },
              deletedAt: null,
            },
            disbursedAt: { gte: monthStart, lt: monthEnd },
            status: { in: ['ACTIVE', 'COMPLETED', 'DEFAULTED'] as any },
          },
          _sum: { principal: true },
        });

        // Calculate customers registered this month
        const customerAchieved = await this.prisma.customer.count({
          where: {
            createdById: t.userId,
            createdAt: { gte: monthStart, lt: monthEnd },
            deletedAt: null,
          },
        });

        const actualDisbursementAchieved = Number(disbursementAchieved._sum?.principal ?? 0);
        const actualCustomerAchieved = customerAchieved;

        return {
          ...t,
          disbursementAchieved: actualDisbursementAchieved, // Override with calculated value
          customerAchieved: actualCustomerAchieved, // Override with calculated value
          disbursementAchievementRate: t.disbursementTarget > 0 
            ? Number(((actualDisbursementAchieved / Number(t.disbursementTarget)) * 100).toFixed(2))
            : 0,
          customerAchievementRate: t.customerTarget > 0
            ? Number(((actualCustomerAchieved / t.customerTarget) * 100).toFixed(2))
            : 0,
        };
      })
    );

    return enrichedTargets;
  }

  async findOne(userId: string, month: string, actor: RequestUser) {
    const targetDate = this.parseMonth(month);
    
    const target = await this.prisma.officerTarget.findUnique({
      where: {
        userId_targetMonth: {
          userId,
          targetMonth: targetDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            branchId: true,
            branch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!target) {
      return null;
    }

    // Check permissions
    const isAdmin = actor.permissions.has('system:admin');
    const canManageUsers = actor.permissions.has('users:manage');
    const isOwnTarget = target.userId === actor.id;
    const isSameBranch = target.user.branchId === actor.branchId;

    if (!isAdmin && !canManageUsers && !isOwnTarget && !isSameBranch) {
      throw new BusinessException('You do not have permission to view this target');
    }

    return {
      ...target,
      disbursementAchievementRate: Number(target.disbursementTarget) > 0
        ? Number(((Number(target.disbursementAchieved) / Number(target.disbursementTarget)) * 100).toFixed(2))
        : 0,
      customerAchievementRate: target.customerTarget > 0
        ? Number(((target.customerAchieved / target.customerTarget) * 100).toFixed(2))
        : 0,
    };
  }

  async setTarget(dto: SetTargetDto, actorId: string) {
    const targetDate = this.parseMonth(dto.targetMonth);

    // Check if target already exists
    const existing = await this.prisma.officerTarget.findUnique({
      where: {
        userId_targetMonth: {
          userId: dto.userId,
          targetMonth: targetDate,
        },
      },
    });

    if (existing) {
      throw new BusinessException(`Target already exists for ${dto.targetMonth}. Use PATCH to update.`);
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new BusinessException('User not found');
    }

    return this.prisma.officerTarget.create({
      data: {
        userId: dto.userId,
        targetMonth: targetDate,
        disbursementTarget: dto.disbursementTarget,
        customerTarget: dto.customerTarget,
        notes: dto.notes,
        createdById: actorId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            branch: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });
  }

  async updateTarget(userId: string, month: string, dto: Partial<SetTargetDto>, actorId: string) {
    const targetDate = this.parseMonth(month);

    const existing = await this.prisma.officerTarget.findUnique({
      where: {
        userId_targetMonth: {
          userId,
          targetMonth: targetDate,
        },
      },
    });

    if (!existing) {
      throw new BusinessException(`Target not found for ${month}`);
    }

    const updateData: any = {};
    if (dto.disbursementTarget !== undefined) updateData.disbursementTarget = dto.disbursementTarget;
    if (dto.customerTarget !== undefined) updateData.customerTarget = dto.customerTarget;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    return this.prisma.officerTarget.update({
      where: {
        userId_targetMonth: {
          userId,
          targetMonth: targetDate,
        },
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            branch: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });
  }

  async getDashboardSummary(actor: RequestUser) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const targetDate = new Date(currentMonth);
    const monthEnd = new Date(targetDate);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const isAdmin = actor.permissions.has('system:admin');
    const canManageUsers = actor.permissions.has('users:manage');

    const where: any = { targetMonth: targetDate };

    // If loan officer, show only their own target
    if (!isAdmin && !canManageUsers) {
      where.userId = actor.id;
    } else if (actor.branchId && !isAdmin) {
      // Branch managers see their branch
      where.user = { branchId: actor.branchId };
    }

    const targets = await this.prisma.officerTarget.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Calculate achievements dynamically
    const enrichedTargets = await Promise.all(
      targets.map(async (t: any) => {
        // Calculate actual disbursements
        const disbursementAchieved = await this.prisma.loan.aggregate({
          where: {
            loanApplication: {
              customer: {
                createdById: t.userId,
              },
              deletedAt: null,
            },
            disbursedAt: { gte: targetDate, lt: monthEnd },
            status: { in: ['ACTIVE', 'COMPLETED', 'DEFAULTED'] as any },
          },
          _sum: { principal: true },
        });

        // Calculate customers registered
        const customerAchieved = await this.prisma.customer.count({
          where: {
            createdById: t.userId,
            createdAt: { gte: targetDate, lt: monthEnd },
            deletedAt: null,
          },
        });

        return {
          ...t,
          disbursementAchieved: Number(disbursementAchieved._sum?.principal ?? 0),
          customerAchieved,
        };
      })
    );

    const summary = {
      totalOfficers: enrichedTargets.length,
      totalDisbursementTarget: enrichedTargets.reduce((sum: number, t: any) => sum + Number(t.disbursementTarget), 0),
      totalDisbursementAchieved: enrichedTargets.reduce((sum: number, t: any) => sum + Number(t.disbursementAchieved), 0),
      totalCustomerTarget: enrichedTargets.reduce((sum: number, t: any) => sum + t.customerTarget, 0),
      totalCustomerAchieved: enrichedTargets.reduce((sum: number, t: any) => sum + t.customerAchieved, 0),
      officersMetDisbursementTarget: enrichedTargets.filter((t: any) => Number(t.disbursementAchieved) >= Number(t.disbursementTarget)).length,
      officersMetCustomerTarget: enrichedTargets.filter((t: any) => t.customerAchieved >= t.customerTarget).length,
      targets: enrichedTargets.map((t: any) => ({
        officer: `${t.user.firstName} ${t.user.lastName}`,
        email: t.user.email,
        disbursementTarget: Number(t.disbursementTarget),
        disbursementAchieved: Number(t.disbursementAchieved),
        disbursementRate: t.disbursementTarget > 0 
          ? Number(((Number(t.disbursementAchieved) / Number(t.disbursementTarget)) * 100).toFixed(2))
          : 0,
        customerTarget: t.customerTarget,
        customerAchieved: t.customerAchieved,
        customerRate: t.customerTarget > 0
          ? Number(((t.customerAchieved / t.customerTarget) * 100).toFixed(2))
          : 0,
      })),
    };

    return summary;
  }

  async getPerformanceTrends(months: number, actor: RequestUser) {
    const isAdmin = actor.permissions.has('system:admin');
    const canManageUsers = actor.permissions.has('users:manage');

    // Generate list of months (current month + previous months)
    const now = new Date();
    const monthList = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthList.push(date);
    }

    // Get all officers with targets or performance
    const officerWhere: any = {
      isActive: true,
      role: 'LOAN_OFFICER',
    };

    // Filter by branch for non-admins
    if (!isAdmin && !canManageUsers && actor.branchId) {
      officerWhere.branchId = actor.branchId;
    }

    const officers = await this.prisma.user.findMany({
      where: officerWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    // Calculate performance for each officer for each month
    const trends = await Promise.all(
      officers.map(async (officer) => {
        const monthlyData = await Promise.all(
          monthList.map(async (monthStart) => {
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);

            // Get target for this month
            const target = await this.prisma.officerTarget.findUnique({
              where: {
                userId_targetMonth: {
                  userId: officer.id,
                  targetMonth: monthStart,
                },
              },
            });

            // Calculate actual disbursements
            const disbursementAchieved = await this.prisma.loan.aggregate({
              where: {
                loanApplication: {
                  customer: {
                    createdById: officer.id,
                  },
                  deletedAt: null,
                },
                disbursedAt: { gte: monthStart, lt: monthEnd },
                status: { in: ['ACTIVE', 'COMPLETED', 'DEFAULTED'] as any },
              },
              _sum: { principal: true },
            });

            // Calculate customers registered
            const customerAchieved = await this.prisma.customer.count({
              where: {
                createdById: officer.id,
                createdAt: { gte: monthStart, lt: monthEnd },
                deletedAt: null,
              },
            });

            return {
              month: monthStart.toISOString().substring(0, 7), // YYYY-MM format
              disbursementTarget: target ? Number(target.disbursementTarget) : 0,
              disbursementAchieved: Number(disbursementAchieved._sum?.principal ?? 0),
              customerTarget: target ? target.customerTarget : 0,
              customerAchieved,
            };
          })
        );

        // Calculate totals
        const totalDisbursement = monthlyData.reduce((sum, m) => sum + m.disbursementAchieved, 0);
        const totalCustomers = monthlyData.reduce((sum, m) => sum + m.customerAchieved, 0);
        const totalDisbursementTarget = monthlyData.reduce((sum, m) => sum + m.disbursementTarget, 0);
        const totalCustomerTarget = monthlyData.reduce((sum, m) => sum + m.customerTarget, 0);

        return {
          officer: {
            id: officer.id,
            name: `${officer.firstName} ${officer.lastName}`,
            email: officer.email,
            branch: officer.branch,
          },
          monthlyData,
          summary: {
            totalDisbursement,
            totalCustomers,
            totalDisbursementTarget,
            totalCustomerTarget,
            disbursementAchievementRate: totalDisbursementTarget > 0
              ? Number(((totalDisbursement / totalDisbursementTarget) * 100).toFixed(2))
              : 0,
            customerAchievementRate: totalCustomerTarget > 0
              ? Number(((totalCustomers / totalCustomerTarget) * 100).toFixed(2))
              : 0,
          },
        };
      })
    );

    // Sort by total disbursement (descending)
    trends.sort((a, b) => b.summary.totalDisbursement - a.summary.totalDisbursement);

    return {
      months: monthList.map(d => d.toISOString().substring(0, 7)),
      officers: trends,
    };
  }

  private parseMonth(month: string): Date {
    // Expects YYYY-MM format
    const parts = month.split('-');
    if (parts.length !== 2) {
      throw new BusinessException('Invalid month format. Use YYYY-MM (e.g., 2026-10)');
    }

    const year = parseInt(parts[0], 10);
    const monthNum = parseInt(parts[1], 10);

    if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new BusinessException('Invalid month format. Use YYYY-MM (e.g., 2026-10)');
    }

    return new Date(`${year}-${String(monthNum).padStart(2, '0')}-01`);
  }
}
