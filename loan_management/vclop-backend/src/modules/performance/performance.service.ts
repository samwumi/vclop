import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, LoanApplicationStatus, SettingScope, SettingType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService, private readonly events: EventEmitter2) {}
  async summary(userId: string) {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    const [targetSetting, applications, disbursed] = await Promise.all([
      this.prisma.setting.findFirst({ where: { key: this.targetKey(userId), scope: SettingScope.SYSTEM, branchId: null } }),
      this.prisma.loanApplication.count({ where: { submittedById: userId, createdAt: { gte: start }, deletedAt: null } }),
      this.prisma.loanApplication.aggregate({ where: { submittedById: userId, status: LoanApplicationStatus.DISBURSED, submittedAt: { gte: start }, deletedAt: null }, _sum: { amount: true }, _count: { _all: true } }),
    ]);
    const target = Number(targetSetting?.value ?? 0); const achievement = Number(disbursed._sum.amount ?? 0);
    return { monthlyTarget: target, currentAchievement: achievement, remainingTarget: Math.max(0, target - achievement), progressPercentage: target > 0 ? Math.min(100, (achievement / target) * 100) : 0, monthlyApplications: applications, monthlyDisbursements: disbursed._count._all };
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
