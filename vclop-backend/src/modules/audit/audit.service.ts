import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';
import { QueryAuditDto } from './dto/query-audit.dto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { paginate } from '../../common/utils/pagination.util';
import { ResourceNotFoundException } from '../../common/exceptions/app.exceptions';

export interface AuditLogPayload {
  userId?: string;
  userEmail?: string;
  userFullName?: string;
  action: AuditAction;
  module: string;
  subModule?: string;
  entityId?: string;
  entityType?: string;
  description?: string;
  oldValues?: unknown;
  newValues?: unknown;
  changedFields?: unknown;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  branchId?: string;
  requestId?: string;
  duration?: number;
  statusCode?: number;
  isSuccess?: boolean;
  errorMessage?: string;
  metadata?: unknown;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────────────────────────
  // EVENT LISTENER — this is how every module writes to the audit trail
  // ────────────────────────────────────────────────────────────────────────────

  @OnEvent('audit.log', { async: true })
  async handleAuditLog(payload: AuditLogPayload): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: payload.userId,
          userEmail: payload.userEmail,
          userFullName: payload.userFullName,
          action: payload.action,
          module: payload.module,
          subModule: payload.subModule,
          entityId: payload.entityId,
          entityType: payload.entityType,
          description: payload.description,
          oldValues: payload.oldValues ? (payload.oldValues as object) : undefined,
          newValues: payload.newValues ? (payload.newValues as object) : undefined,
          changedFields: payload.changedFields ? (payload.changedFields as object) : undefined,
          ipAddress: payload.ipAddress,
          userAgent: payload.userAgent,
          browser: payload.browser,
          os: payload.os,
          device: payload.device,
          branchId: payload.branchId,
          requestId: payload.requestId,
          duration: payload.duration,
          statusCode: payload.statusCode,
          isSuccess: payload.isSuccess ?? true,
          errorMessage: payload.errorMessage,
          metadata: payload.metadata ? (payload.metadata as object) : undefined,
        },
      });
    } catch (err) {
      // Audit log failures must NEVER crash the application
      this.logger.error(`Failed to write audit log: ${(err as Error).message}`, (err as Error).stack);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // QUERY
  // ────────────────────────────────────────────────────────────────────────────

  async findAll(query: QueryAuditDto): Promise<PaginatedResult<unknown>> {
    const where = {
      ...(query.action && { action: query.action }),
      ...(query.module && { module: query.module }),
      ...(query.userId && { userId: query.userId }),
      ...(query.entityId && { entityId: query.entityId }),
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.branchId && { branchId: query.branchId }),
      ...(query.isSuccess !== undefined && { isSuccess: query.isSuccess }),
      ...((query.dateFrom || query.dateTo) && {
        createdAt: {
          ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
          ...(query.dateTo && { lte: new Date(query.dateTo) }),
        },
      }),
      ...(query.search && {
        OR: [
          { description: { contains: query.search } },
          { userEmail: { contains: query.search } },
          { userFullName: { contains: query.search } },
          { entityType: { contains: query.search } },
          { ipAddress: { contains: query.search } },
        ],
      }),
    };

    const sortField = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatarPath: true } },
        },
        orderBy: { [sortField]: sortOrder },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginate(data, total, query.page ?? 1, query.limit ?? 25);
  }

  async findOne(id: string): Promise<unknown> {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!log) throw new ResourceNotFoundException('AuditLog', id);
    return log;
  }

  async getEntityHistory(entityType: string, entityId: string): Promise<unknown[]> {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserActivity(userId: string, limit = 50): Promise<unknown[]> {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getModules(): Promise<string[]> {
    const result = await this.prisma.auditLog.findMany({
      select: { module: true },
      distinct: ['module'],
      orderBy: { module: 'asc' },
    });
    return result.map((r) => r.module);
  }

  async getStats(days = 7): Promise<unknown> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [total, byAction, byModule, failedLogins, recentActivity] = await Promise.all([
      this.prisma.auditLog.count({ where: { createdAt: { gte: since } } }),

      this.prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        where: { createdAt: { gte: since } },
        orderBy: { _count: { action: 'desc' } },
      }),

      this.prisma.auditLog.groupBy({
        by: ['module'],
        _count: { module: true },
        where: { createdAt: { gte: since } },
        orderBy: { _count: { module: 'desc' } },
      }),

      this.prisma.auditLog.count({
        where: { action: AuditAction.LOGIN_FAILED, createdAt: { gte: since } },
      }),

      this.prisma.auditLog.findMany({
        where: { createdAt: { gte: since } },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return { total, byAction, byModule, failedLogins, recentActivity, periodDays: days };
  }
}
