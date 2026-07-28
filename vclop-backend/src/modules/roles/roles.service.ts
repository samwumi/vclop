import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SyncPermissionsDto } from './dto/sync-permissions.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/utils/pagination.util';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import {
  ResourceNotFoundException,
  ResourceAlreadyExistsException,
  BusinessException,
  ForbiddenActionException,
} from '../../common/exceptions/app.exceptions';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<unknown>> {
    const where = {
      deletedAt: null,
      ...(query.search && {
        OR: [
          { name: { contains: query.search } },
          { code: { contains: query.search } },
          { description: { contains: query.search } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        include: {
          _count: { select: { userRoles: true, rolePermissions: true } },
          rolePermissions: { include: { permission: { select: { id: true, code: true, name: true, category: true } } } },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.role.count({ where }),
    ]);

    return paginate(data, total, query.page ?? 1, query.limit ?? 25);
  }

  async findOne(id: string): Promise<unknown> {
    const role = await this.prisma.role.findFirst({
      where: { id, deletedAt: null },
      include: {
        rolePermissions: {
          include: { permission: true },
          orderBy: { permission: { category: 'asc' } },
        },
        _count: { select: { userRoles: true } },
      },
    });
    if (!role) throw new ResourceNotFoundException('Role', id);
    return role;
  }

  async create(dto: CreateRoleDto, createdById: string): Promise<unknown> {
    const existing = await this.prisma.role.findFirst({
      where: { code: dto.code.toUpperCase(), deletedAt: null },
    });
    if (existing) throw new ResourceAlreadyExistsException('Role', 'code', dto.code);

    const role = await this.prisma.role.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        isSystem: false,
      },
    });

    if (dto.permissionIds?.length) {
      await this.syncPermissions(role.id, { permissionIds: dto.permissionIds }, createdById);
    }

    this.events.emit('audit.log', {
      userId: createdById, action: AuditAction.CREATE, module: 'roles',
      entityId: role.id, entityType: 'Role',
      description: `Created role ${role.code}`, isSuccess: true,
    });

    return this.findOne(role.id);
  }

  async update(id: string, dto: UpdateRoleDto, updatedById: string): Promise<unknown> {
    const role = await this.assertExists(id);
    if (role.isSystem && dto.isActive === false) {
      throw new ForbiddenActionException('System roles cannot be deactivated');
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });

    this.events.emit('audit.log', {
      userId: updatedById, action: AuditAction.UPDATE, module: 'roles',
      entityId: id, entityType: 'Role',
      description: `Updated role ${updated.code}`, newValues: dto, isSuccess: true,
    });

    return this.findOne(id);
  }

  async remove(id: string, deletedById: string): Promise<void> {
    const role = await this.assertExists(id);
    if (role.isSystem) throw new ForbiddenActionException('System roles cannot be deleted');

    // Check no active users are still assigned this role
    const assignedCount = await this.prisma.userRole.count({ where: { roleId: id } });
    if (assignedCount > 0) {
      throw new BusinessException(
        `Cannot delete role — ${assignedCount} user(s) are still assigned to it. Revoke first.`,
      );
    }

    await this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.events.emit('audit.log', {
      userId: deletedById, action: AuditAction.DELETE, module: 'roles',
      entityId: id, entityType: 'Role', description: `Deleted role ${role.code}`, isSuccess: true,
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PERMISSION SYNC  (full replace — this is the safe way to manage role perms)
  // ────────────────────────────────────────────────────────────────────────────

  async syncPermissions(roleId: string, dto: SyncPermissionsDto, updatedById: string): Promise<void> {
    await this.assertExists(roleId);

    const perms = await this.prisma.permission.findMany({
      where: { id: { in: dto.permissionIds }, isActive: true },
    });

    if (perms.length !== dto.permissionIds.length) {
      throw new BusinessException('One or more permission IDs are invalid');
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      ...dto.permissionIds.map((permissionId) =>
        this.prisma.rolePermission.create({ data: { roleId, permissionId, createdById: updatedById } }),
      ),
    ]);

    this.events.emit('audit.log', {
      userId: updatedById, action: AuditAction.UPDATE, module: 'roles',
      entityId: roleId, entityType: 'Role',
      description: `Synced ${dto.permissionIds.length} permissions on role`,
      newValues: { permissionIds: dto.permissionIds }, isSuccess: true,
    });
  }

  async addPermissions(roleId: string, permissionIds: string[], updatedById: string): Promise<void> {
    await this.assertExists(roleId);

    const perms = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds }, isActive: true },
    });
    if (perms.length !== permissionIds.length) throw new BusinessException('Invalid permission IDs');

    await this.prisma.$transaction(
      permissionIds.map((permissionId) =>
        this.prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId } },
          update: {},
          create: { roleId, permissionId, createdById: updatedById },
        }),
      ),
    );
  }

  async removePermissions(roleId: string, permissionIds: string[], updatedById: string): Promise<void> {
    await this.assertExists(roleId);

    await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId: { in: permissionIds } },
    });
  }

  private async assertExists(id: string) {
    const role = await this.prisma.role.findFirst({ where: { id, deletedAt: null } });
    if (!role) throw new ResourceNotFoundException('Role', id);
    return role;
  }
}
