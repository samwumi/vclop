import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { TokenService } from '../auth/token.service';
import { User, AuditAction, UserStatus } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { AssignRolesDto, RevokeRolesDto } from './dto/assign-roles.dto';
import { BulkAssignPermissionsDto, RevokePermissionsDto } from './dto/assign-permissions.dto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { paginate } from '../../common/utils/pagination.util';
import {
  ResourceNotFoundException,
  ResourceAlreadyExistsException,
  BusinessException,
  ForbiddenActionException,
} from '../../common/exceptions/app.exceptions';
import { hashPassword } from '../../common/utils/hash.util';
import { validatePassword, getDefaultPasswordPolicy } from '../../common/utils/password-validator.util';
import dayjs from 'dayjs';

const USER_SELECT = {
  id: true, employeeId: true, email: true, phone: true, username: true,
  firstName: true, middleName: true, lastName: true, suffix: true,
  gender: true, dateOfBirth: true, avatarPath: true, status: true,
  branchId: true, departmentId: true, supervisorId: true, jobTitle: true,
  emailVerifiedAt: true, lastLoginAt: true, mustChangePassword: true,
  twoFactorEnabled: true, timezone: true, locale: true,
  createdAt: true, updatedAt: true, deletedAt: true,
  branch: { select: { id: true, name: true, code: true } },
  department: { select: { id: true, name: true, code: true } },
  userRoles: {
    where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    include: { role: { select: { id: true, name: true, code: true } } },
  },
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly tokenService: TokenService,
    private readonly config: ConfigService,
    private readonly events: EventEmitter2,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // LIST
  // ────────────────────────────────────────────────────────────────────────────

  async findAll(query: QueryUsersDto): Promise<PaginatedResult<unknown>> {
    const where = {
      ...(!query.withDeleted && { deletedAt: null }),
      ...(query.status && { status: query.status }),
      ...(query.branchId && { branchId: query.branchId }),
      ...(query.departmentId && { departmentId: query.departmentId }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search } },
          { lastName: { contains: query.search } },
          { email: { contains: query.search } },
          { username: { contains: query.search } },
          { employeeId: { contains: query.search } },
        ],
      }),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { createdAt: query.sortOrder };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy,
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.user.count({ where }),
    ]);

    const mapped = data.map((u) => this.mapUser(u as Record<string, unknown>));
    return paginate(mapped, total, query.page ?? 1, query.limit ?? 25);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // GET ONE
  // ────────────────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<unknown> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_SELECT,
    });
    if (!user) throw new ResourceNotFoundException('User', id);
    return this.mapUser(user as Record<string, unknown>);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ────────────────────────────────────────────────────────────────────────────

  async create(dto: CreateUserDto, createdById: string): Promise<unknown> {
    // Check uniqueness across ALL users including soft-deleted (DB unique constraint applies to all rows)
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email.toLowerCase() },
          { username: dto.username.toLowerCase() },
          ...(dto.phone ? [{ phone: dto.phone }] : []),
          ...(dto.employeeId ? [{ employeeId: dto.employeeId }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.email === dto.email.toLowerCase()) throw new ResourceAlreadyExistsException('User', 'email', dto.email);
      if (existing.username === dto.username.toLowerCase()) throw new ResourceAlreadyExistsException('User', 'username', `Username "${dto.username}" is already taken — choose a different one`);
      throw new BusinessException('Phone or employee ID already in use');
    }

    const policy = getDefaultPasswordPolicy();
    const validation = validatePassword(dto.password, policy);
    if (!validation.valid) throw new BusinessException(validation.errors.join('. '));

    const passwordHash = await hashPassword(dto.password, this.config.get<number>('auth.bcryptRounds') ?? 12);

    const user = await this.prisma.user.create({
      data: {
        employeeId: dto.employeeId,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        username: dto.username.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        suffix: dto.suffix,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        branchId: dto.branchId,
        departmentId: dto.departmentId,
        supervisorId: dto.supervisorId,
        jobTitle: dto.jobTitle,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        mustChangePassword: true,
        createdById,
      },
      select: USER_SELECT,
    });

    if (dto.roleIds?.length) {
      await this.assignRoles(user.id, { roleIds: dto.roleIds }, createdById);
    }

    // Admin-created accounts are pre-verified — no email verification needed
    // The user will be prompted to change their password on first login

    this.events.emit('audit.log', {
      userId: createdById, action: AuditAction.CREATE, module: 'users',
      entityId: user.id, entityType: 'User',
      description: `Created user ${user.email}`,
      newValues: { email: user.email, username: user.username }, isSuccess: true,
    });

    const fresh = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: USER_SELECT });
    return this.mapUser(fresh as Record<string, unknown>);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ────────────────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateUserDto, updatedById: string): Promise<unknown> {
    await this.assertExists(id);

    if (dto.email || dto.phone) {
      const conflict = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          deletedAt: null,
          OR: [
            ...(dto.email ? [{ email: dto.email.toLowerCase() }] : []),
            ...(dto.phone ? [{ phone: dto.phone }] : []),
          ],
        },
      });
      if (conflict) throw new BusinessException('Email or phone already in use by another account');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.employeeId !== undefined && { employeeId: dto.employeeId }),
        ...(dto.email && { email: dto.email.toLowerCase() }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.middleName !== undefined && { middleName: dto.middleName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.suffix !== undefined && { suffix: dto.suffix }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) }),
        ...(dto.branchId !== undefined && { branchId: dto.branchId }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.supervisorId !== undefined && { supervisorId: dto.supervisorId }),
        ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
        ...(dto.status && { status: dto.status }),
        ...(dto.mustChangePassword !== undefined && { mustChangePassword: dto.mustChangePassword }),
        ...(dto.timezone && { timezone: dto.timezone }),
        ...(dto.locale && { locale: dto.locale }),
        updatedById,
      },
      select: USER_SELECT,
    });

    this.events.emit('audit.log', {
      userId: updatedById, action: AuditAction.UPDATE, module: 'users',
      entityId: id, entityType: 'User',
      description: `Updated user ${updated.email}`, newValues: dto, isSuccess: true,
    });

    return this.mapUser(updated as Record<string, unknown>);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SOFT DELETE / RESTORE
  // ────────────────────────────────────────────────────────────────────────────

  async remove(id: string, deletedById: string): Promise<void> {
    const user = await this.assertExists(id);
    if (id === deletedById) throw new ForbiddenActionException('You cannot delete your own account');

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: UserStatus.INACTIVE },
    });

    this.events.emit('audit.log', {
      userId: deletedById, action: AuditAction.DELETE, module: 'users',
      entityId: id, entityType: 'User', description: `Soft-deleted user ${user.email}`, isSuccess: true,
    });
  }

  async restore(id: string, restoredById: string): Promise<unknown> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user?.deletedAt) throw new BusinessException('User is not deleted');

    const restored = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null, status: UserStatus.INACTIVE },
      select: USER_SELECT,
    });

    this.events.emit('audit.log', {
      userId: restoredById, action: AuditAction.RESTORE, module: 'users',
      entityId: id, entityType: 'User', description: `Restored user ${user.email}`, isSuccess: true,
    });

    return this.mapUser(restored as Record<string, unknown>);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // LOCK / UNLOCK
  // ────────────────────────────────────────────────────────────────────────────

  async lock(id: string, adminId: string, reason?: string): Promise<void> {
    const user = await this.assertExists(id);
    if (id === adminId) throw new ForbiddenActionException('Cannot lock your own account');

    await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.LOCKED, lockedUntil: null },
    });

    this.events.emit('audit.log', {
      userId: adminId, action: AuditAction.LOCK, module: 'users',
      entityId: id, entityType: 'User',
      description: `Locked user ${user.email}${reason ? `: ${reason}` : ''}`, isSuccess: true,
    });
  }

  async unlock(id: string, adminId: string): Promise<void> {
    const user = await this.assertExists(id);

    await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE, failedLoginCount: 0, lockedUntil: null },
    });

    this.events.emit('audit.log', {
      userId: adminId, action: AuditAction.UNLOCK, module: 'users',
      entityId: id, entityType: 'User', description: `Unlocked user ${user.email}`, isSuccess: true,
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ADMIN PASSWORD RESET
  // ────────────────────────────────────────────────────────────────────────────

  async adminResetPassword(id: string, newPassword: string, adminId: string): Promise<void> {
    await this.assertExists(id);

    const policy = getDefaultPasswordPolicy();
    const validation = validatePassword(newPassword, policy);
    if (!validation.valid) throw new BusinessException(validation.errors.join('. '));

    const passwordHash = await hashPassword(newPassword, this.config.get<number>('auth.bcryptRounds') ?? 12);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true, failedLoginCount: 0, lockedUntil: null },
    });

    await this.prisma.token.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.events.emit('audit.log', {
      userId: adminId, action: AuditAction.PASSWORD_RESET, module: 'users',
      entityId: id, entityType: 'User', description: 'Admin reset user password', isSuccess: true,
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ROLE ASSIGNMENT
  // ────────────────────────────────────────────────────────────────────────────

  async assignRoles(userId: string, dto: AssignRolesDto, assignedById: string): Promise<void> {
    await this.assertExists(userId);

    const roles = await this.prisma.role.findMany({
      where: { id: { in: dto.roleIds }, isActive: true, deletedAt: null },
    });

    if (roles.length !== dto.roleIds.length) throw new BusinessException('One or more role IDs are invalid or inactive');

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;

    await this.prisma.$transaction(
      dto.roleIds.map((roleId) =>
        this.prisma.userRole.upsert({
          where: { userId_roleId: { userId, roleId } },
          update: { expiresAt: expiresAt ?? null, assignedById },
          create: { id: require('uuid').v4(), userId, roleId, assignedById, expiresAt },
        }),
      ),
    );

    this.events.emit('audit.log', {
      userId: assignedById, action: AuditAction.ROLE_ASSIGN, module: 'users',
      entityId: userId, entityType: 'User',
      description: `Assigned roles: ${roles.map((r) => r.code).join(', ')}`,
      newValues: { roleIds: dto.roleIds }, isSuccess: true,
    });
  }

  async revokeRoles(userId: string, dto: RevokeRolesDto, revokedById: string): Promise<void> {
    await this.assertExists(userId);

    await this.prisma.userRole.deleteMany({
      where: { userId, roleId: { in: dto.roleIds } },
    });

    this.events.emit('audit.log', {
      userId: revokedById, action: AuditAction.ROLE_REVOKE, module: 'users',
      entityId: userId, entityType: 'User',
      description: 'Revoked roles', oldValues: { roleIds: dto.roleIds }, isSuccess: true,
    });
  }

  async getUserRoles(userId: string): Promise<unknown[]> {
    await this.assertExists(userId);
    return this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // DIRECT PERMISSION OVERRIDES
  // ────────────────────────────────────────────────────────────────────────────

  async assignPermissions(
    userId: string,
    dto: BulkAssignPermissionsDto,
    assignedById: string,
  ): Promise<void> {
    await this.assertExists(userId);

    const permIds = dto.permissions.map((p) => p.permissionId);
    const perms = await this.prisma.permission.findMany({
      where: { id: { in: permIds }, isActive: true },
    });

    if (perms.length !== permIds.length) throw new BusinessException('One or more permission IDs are invalid or inactive');

    await this.prisma.$transaction(
      dto.permissions.map((p) =>
        this.prisma.userPermission.upsert({
          where: { userId_permissionId: { userId, permissionId: p.permissionId } },
          update: { granted: p.granted, reason: p.reason ?? null, expiresAt: p.expiresAt ? new Date(p.expiresAt) : null, assignedById },
          create: { userId, permissionId: p.permissionId, granted: p.granted, reason: p.reason, expiresAt: p.expiresAt ? new Date(p.expiresAt) : undefined, assignedById },
        }),
      ),
    );

    this.events.emit('audit.log', {
      userId: assignedById, action: AuditAction.PERMISSION_GRANT, module: 'users',
      entityId: userId, entityType: 'User',
      description: 'Bulk permission override applied', newValues: dto.permissions, isSuccess: true,
    });
  }

  async revokePermissions(userId: string, dto: RevokePermissionsDto, revokedById: string): Promise<void> {
    await this.assertExists(userId);

    await this.prisma.userPermission.deleteMany({
      where: { userId, permissionId: { in: dto.permissionIds } },
    });

    this.events.emit('audit.log', {
      userId: revokedById, action: AuditAction.PERMISSION_REVOKE, module: 'users',
      entityId: userId, entityType: 'User', description: 'Removed permission overrides', isSuccess: true,
    });
  }

  async getUserPermissions(userId: string): Promise<unknown[]> {
    await this.assertExists(userId);
    return this.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // AVATAR
  // ────────────────────────────────────────────────────────────────────────────

  async uploadAvatar(userId: string, file: Express.Multer.File, updatedById: string): Promise<{ avatarUrl: string }> {
    const user = await this.assertExists(userId);

    if (user.avatarPath) await this.storage.deleteFile(user.avatarPath);

    const stored = await this.storage.storeFile(file, 'avatars');

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarPath: stored.key },
    });

    return { avatarUrl: stored.url };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PRIVATE
  // ────────────────────────────────────────────────────────────────────────────

  private async assertExists(id: string): Promise<User> {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new ResourceNotFoundException('User', id);
    return user;
  }

  async getManagedBranches(userId: string) {
    return this.prisma.userBranch.findMany({
      where: { userId },
      include: { branch: { select: { id: true, code: true, name: true, isActive: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addManagedBranch(userId: string, branchId: string, actorId: string) {
    const existing = await this.prisma.userBranch.findUnique({
      where: { userId_branchId: { userId, branchId } },
    });
    if (existing) return existing;
    const record = await this.prisma.userBranch.create({ data: { userId, branchId } });
    this.events.emit('audit.log', { userId: actorId, action: AuditAction.UPDATE, module: 'users', entityId: userId, entityType: 'User', description: `Assigned branch ${branchId} to user ${userId}`, isSuccess: true });
    return record;
  }

  async removeManagedBranch(userId: string, branchId: string, actorId: string) {
    await this.prisma.userBranch.deleteMany({ where: { userId, branchId } });
    this.events.emit('audit.log', { userId: actorId, action: AuditAction.UPDATE, module: 'users', entityId: userId, entityType: 'User', description: `Removed branch ${branchId} from user ${userId}`, isSuccess: true });
  }

  private mapUser(user: Record<string, unknown>): unknown {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, twoFactorSecret, userRoles, ...safe } = user;
    const roles = (userRoles as Array<{ role: unknown }> | undefined)?.map((ur) => ur.role) ?? [];
    return { ...safe, roles };
  }
}
