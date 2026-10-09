import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { BusinessException } from '../../common/exceptions/business.exception';
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
        { user: { firstName: 'asc' } },
      ],
    });

    return targets.map(t => ({
      ...t,
      disbursementAchievementRate: t.disbursementTarget > 0 
        ? Number(((Number(t.disbursementAchieved) / Number(t.disbursementTarget)) * 100).toFixed(2))
        : 0,
      customerAchievementRate: t.customerTarget > 0
        ? Number(((t.customerAchieved / t.customerTarget) * 100).toFixed(2))
        : 0,
    }));
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
      disbursementAchievementRate: target.disbursementTarget > 0
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

    const summary = {
      totalOfficers: targets.length,
      totalDisbursementTarget: targets.reduce((sum, t) => sum + Number(t.disbursementTarget), 0),
      totalDisbursementAchieved: targets.reduce((sum, t) => sum + Number(t.disbursementAchieved), 0),
      totalCustomerTarget: targets.reduce((sum, t) => sum + t.customerTarget, 0),
      totalCustomerAchieved: targets.reduce((sum, t) => sum + t.customerAchieved, 0),
      officersMetDisbursementTarget: targets.filter(t => Number(t.disbursementAchieved) >= Number(t.disbursementTarget)).length,
      officersMetCustomerTarget: targets.filter(t => t.customerAchieved >= t.customerTarget).length,
      targets: targets.map(t => ({
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
