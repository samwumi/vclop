import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { SaveLayoutDto, UpdateLayoutDto } from './dto/dashboard.dto';
import {
  ResourceNotFoundException,
  ForbiddenActionException,
  BusinessException,
} from '../../common/exceptions/app.exceptions';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────────────────────────
  // BOOTSTRAP — what the frontend loads after login
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Returns the user's dashboard:
   *  1. Resolve which widgets they can see (based on permissions)
   *  2. Load their saved layout (default first)
   *  3. If no layout saved, generate a default one from available widgets
   */
  async getUserDashboard(user: RequestUser): Promise<{
    widgets: unknown[];
    layout: unknown | null;
    availableWidgets: unknown[];
  }> {
    // All active widgets, ordered
    const allWidgets = await this.prisma.widget.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Filter to widgets the user has permission to see
    const availableWidgets = allWidgets.filter((w) => {
      if (!w.requiredPermission) return true;
      return user.permissions.has('system:admin') || user.permissions.has(w.requiredPermission);
    });

    const widgetIds = new Set(availableWidgets.map((w) => w.id));

    // Load user's default layout
    let layout = await this.prisma.dashboardLayout.findFirst({
      where: { userId: user.id, isDefault: true },
      include: {
        items: {
          include: { widget: true },
          orderBy: [{ posY: 'asc' }, { posX: 'asc' }],
        },
      },
    });

    // Filter layout items to only authorized widgets
    if (layout) {
      layout = {
        ...layout,
        items: layout.items.filter((item) => widgetIds.has(item.widgetId)),
      };
    }

    return {
      widgets: availableWidgets,
      layout,
      availableWidgets,
    };
  }

  async getOperationalSummary(user: RequestUser) {
    const isAdministrator = user.permissions.has('system:admin');
    const canDisburse = isAdministrator || user.permissions.has('loan_applications:disburse_head');
    const canIC      = isAdministrator || user.permissions.has('loan_applications:internal_control_approve');
    const canReview  = isAdministrator || user.permissions.has('loan_applications:compliance_review');
    const canCollect = isAdministrator || user.permissions.has('loan_applications:record_repayment');
    const canManage  = isAdministrator || user.permissions.has('settings:update');
    const ownedApplications = !canReview && !canDisburse && !canIC && !canManage;
    const applicationScope  = ownedApplications ? { submittedById: user.id } : {};
    const [myTasks, applications, complianceQueue, icQueue, approvedLoans, collectionCases, transportRequests, overdueInstallments] = await Promise.all([
      this.prisma.workflowTask.count({ where: { assignedToId: user.id, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } } }),
      this.prisma.loanApplication.count({ where: { deletedAt: null, ...applicationScope } }),
      canReview ? this.prisma.loanApplication.count({
        where: {
          deletedAt: null,
          status: { in: ['COMPLIANCE_REVIEW', 'AWAITING_INFORMATION'] },
          // Scope to officer's branch if they have one
          ...(user.branchId && !isAdministrator ? { customer: { branchId: user.branchId } } : {}),
        },
      }) : 0,
      canIC     ? this.prisma.loanApplication.count({ where: { deletedAt: null, status: 'INTERNAL_CONTROL_REVIEW' } }) : 0,
      canDisburse ? this.prisma.loanApplication.count({ where: { deletedAt: null, status: 'APPROVED' } }) : 0,
      canCollect  ? this.prisma.collectionCase.count({ where: { status: { in: ['OPEN', 'PROMISE_TO_PAY', 'BROKEN_PROMISE', 'LEGAL'] } } }) : 0,
      canReview || canManage || canIC ? this.prisma.transportRequest.count({ where: { status: { in: ['PENDING', 'OPERATIONS_REVIEW'] } } }) : 0,
      canCollect  ? this.prisma.repaymentInstallment.count({ where: { dueDate: { lt: new Date() }, status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } } }) : 0,
    ]);

    const role = isAdministrator ? 'SUPER_ADMIN'
      : canDisburse ? 'ACCOUNTING'
      : canIC       ? 'INTERNAL_CONTROL'
      : canReview   ? 'UNDERWRITER_COMPLIANCE'
      : canCollect  ? 'COLLECTIONS'
      : 'LOAN_OFFICER';

    return { role, myTasks, applications, complianceQueue, icQueue, approvedLoans, collectionCases, transportRequests, overdueInstallments };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // LAYOUTS
  // ────────────────────────────────────────────────────────────────────────────

  async getUserLayouts(userId: string): Promise<unknown[]> {
    return this.prisma.dashboardLayout.findMany({
      where: { userId },
      include: {
        items: {
          include: { widget: { select: { id: true, code: true, name: true, type: true, size: true, component: true } } },
          orderBy: [{ posY: 'asc' }, { posX: 'asc' }],
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async saveLayout(userId: string, dto: SaveLayoutDto): Promise<unknown> {
    // Validate all widget IDs exist and user has access
    const widgetIds = dto.items.map((i) => i.widgetId);
    const widgets = await this.prisma.widget.findMany({
      where: { id: { in: widgetIds }, isActive: true },
    });

    if (widgets.length !== new Set(widgetIds).size) {
      throw new BusinessException('One or more widget IDs are invalid');
    }

    // If setting as default, unset previous default
    if (dto.isDefault) {
      await this.prisma.dashboardLayout.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const layout = await this.prisma.dashboardLayout.create({
      data: {
        userId,
        name: dto.name,
        isDefault: dto.isDefault ?? false,
        items: {
          create: dto.items.map((item) => ({
            widgetId: item.widgetId,
            posX: item.posX,
            posY: item.posY,
            width: item.width,
            height: item.height,
            config: item.config ? JSON.stringify(item.config) : undefined,
          })),
        },
      },
      include: {
        items: {
          include: { widget: true },
        },
      },
    });

    return layout;
  }

  async updateLayout(userId: string, layoutId: string, dto: UpdateLayoutDto): Promise<unknown> {
    const layout = await this.prisma.dashboardLayout.findUnique({ where: { id: layoutId } });
    if (!layout) throw new ResourceNotFoundException('DashboardLayout', layoutId);
    if (layout.userId !== userId) throw new ForbiddenActionException();

    if (dto.isDefault) {
      await this.prisma.dashboardLayout.updateMany({
        where: { userId, isDefault: true, id: { not: layoutId } },
        data: { isDefault: false },
      });
    }

    // If items provided, replace them entirely
    if (dto.items) {
      await this.prisma.dashboardLayoutItem.deleteMany({ where: { layoutId } });
    }

    const updated = await this.prisma.dashboardLayout.update({
      where: { id: layoutId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.items && {
          items: {
            create: dto.items.map((item) => ({
              widgetId: item.widgetId,
              posX: item.posX,
              posY: item.posY,
              width: item.width,
              height: item.height,
              config: item.config ? JSON.stringify(item.config) : undefined,
            })),
          },
        }),
      },
      include: { items: { include: { widget: true } } },
    });

    return updated;
  }

  async deleteLayout(userId: string, layoutId: string): Promise<void> {
    const layout = await this.prisma.dashboardLayout.findUnique({ where: { id: layoutId } });
    if (!layout) throw new ResourceNotFoundException('DashboardLayout', layoutId);
    if (layout.userId !== userId) throw new ForbiddenActionException();

    await this.prisma.dashboardLayout.delete({ where: { id: layoutId } });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // WIDGETS CATALOG (admin)
  // ────────────────────────────────────────────────────────────────────────────

  async getAllWidgets(): Promise<unknown[]> {
    return this.prisma.widget.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // DATA ENDPOINTS — each widget's live data
  // ────────────────────────────────────────────────────────────────────────────

  async getActiveUsersStats(): Promise<unknown> {
    const [total, active, locked, pending] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'LOCKED' } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'PENDING_VERIFICATION' } }),
    ]);
    return { total, active, locked, pending };
  }

  async getTotalBranchesStats(): Promise<unknown> {
    const [total, active] = await Promise.all([
      this.prisma.branch.count({ where: { deletedAt: null } }),
      this.prisma.branch.count({ where: { deletedAt: null, isActive: true } }),
    ]);
    return { total, active };
  }

  async getTotalDepartmentsStats(): Promise<unknown> {
    const [total, active] = await Promise.all([
      this.prisma.department.count({ where: { deletedAt: null } }),
      this.prisma.department.count({ where: { deletedAt: null, isActive: true } }),
    ]);
    return { total, active };
  }

  async getUserStatusChart(): Promise<unknown[]> {
    // Cast to any to work around Prisma groupBy overload typing in this TS setup
    return (this.prisma.user.groupBy as any)({
      by: ['status'],
      _count: { status: true },
      where: { deletedAt: null },
    });
  }

  async getLoginActivityChart(days = 7): Promise<unknown[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: { in: ['LOGIN', 'LOGIN_FAILED'] },
        createdAt: { gte: since },
      },
      select: { action: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const grouped: Record<string, { date: string; logins: number; failures: number }> = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0]!;
      grouped[key] = { date: key, logins: 0, failures: 0 };
    }

    for (const log of logs) {
      const key = log.createdAt.toISOString().split('T')[0]!;
      if (grouped[key]) {
        if (log.action === 'LOGIN') grouped[key]!.logins++;
        else grouped[key]!.failures++;
      }
    }

    return Object.values(grouped);
  }

  async getRecentAuditLogs(limit = 10): Promise<unknown[]> {
    return this.prisma.auditLog.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true, avatarPath: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getSystemHealth(): Promise<unknown> {
    const dbStart = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    const memUsage = process.memoryUsage();

    return {
      status: 'healthy',
      database: { status: 'connected', latencyMs: dbLatency },
      memory: {
        heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
        rssMb: Math.round(memUsage.rss / 1024 / 1024),
      },
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
