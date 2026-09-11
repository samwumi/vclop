import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, LoanApplicationStatus, SettingScope, SettingType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService, private readonly events: EventEmitter2) {}

  async summary(userId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Current week (Mon–Sun)
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // ISO week day: Mon=1
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek + 1);
    weekStart.setHours(0, 0, 0, 0);

    const [targetSetting, allowanceFormulaSetting, applications, disbursed, weekDisbursed, approvalRate] =
      await Promise.all([
        this.prisma.setting.findFirst({ where: { key: this.targetKey(userId), scope: SettingScope.SYSTEM, branchId: null } }),
        this.prisma.setting.findFirst({ where: { key: 'performance.weekly_allowance_per_million', scope: SettingScope.SYSTEM, branchId: null } }),
        this.prisma.loanApplication.count({ where: { submittedById: userId, createdAt: { gte: monthStart }, deletedAt: null } }),
        this.prisma.loanApplication.aggregate({
          where: { submittedById: userId, status: LoanApplicationStatus.DISBURSED, submittedAt: { gte: monthStart }, deletedAt: null },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.loanApplication.aggregate({
          where: { submittedById: userId, status: LoanApplicationStatus.DISBURSED, submittedAt: { gte: weekStart }, deletedAt: null },
          _sum: { amount: true },
        }),
        this.prisma.loanApplication.count({
          where: {
            submittedById: userId,
            createdAt: { gte: monthStart },
            deletedAt: null,
            status: { in: [LoanApplicationStatus.DISBURSED, LoanApplicationStatus.APPROVED, LoanApplicationStatus.REJECTED] },
          },
        }),
      ]);

    const target = Number(targetSetting?.value ?? 0);
    const achievement = Number(disbursed._sum.amount ?? 0);
    const weeklyDisbursedAmount = Number(weekDisbursed._sum.amount ?? 0);

    // Weekly allowance: admin configures ₦X per ₦1,000,000 disbursed that week
    const allowancePerMillion = Number(allowanceFormulaSetting?.value ?? 0);
    const weeklyAllowance = allowancePerMillion > 0
      ? Math.floor((weeklyDisbursedAmount / 1_000_000) * allowancePerMillion)
      : 0;

    const reviewed = approvalRate;
    const disbursedCount = disbursed._count._all;
    const approvalPercentage = reviewed > 0 ? Math.min(100, (disbursedCount / reviewed) * 100) : 0;

    return {
      monthlyTarget: target,
      currentAchievement: achievement,
      remainingTarget: Math.max(0, target - achievement),
      progressPercentage: target > 0 ? Math.min(100, (achievement / target) * 100) : 0,
      monthlyApplications: applications,
      monthlyDisbursements: disbursedCount,
      weeklyDisbursedAmount,
      weeklyAllowance,
      allowancePerMillion,
      approvalPercentage: Math.round(approvalPercentage),
    };
  }

  async setTarget(userId: string, amount: number, actorId: string) {
    const existing = await this.prisma.setting.findFirst({ where: { key: this.targetKey(userId), scope: SettingScope.SYSTEM, branchId: null } });
    const setting = existing
      ? await this.prisma.setting.update({ where: { id: existing.id }, data: { value: String(amount) } })
      : await this.prisma.setting.create({ data: { key: this.targetKey(userId), value: String(amount), defaultValue: '0', type: SettingType.NUMBER, scope: SettingScope.SYSTEM, label: `Monthly target for ${userId}`, group: 'performance', isPublic: false, isReadonly: false } });
    this.events.emit('audit.log', { userId: actorId, action: AuditAction.UPDATE, module: 'performance', entityId: setting.id, entityType: 'Setting', description: `Updated monthly target for ${userId}`, isSuccess: true });
    return setting;
  }

  private targetKey(userId: string) { return `performance.monthly_target.${userId}`; }
}
