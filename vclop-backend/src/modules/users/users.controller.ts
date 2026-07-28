import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { AssignRolesDto, RevokeRolesDto } from './dto/assign-roles.dto';
import { BulkAssignPermissionsDto, RevokePermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { AuditAction } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // ── List ────────────────────────────────────────────────────────────────────
  @Get()
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'List users with pagination, search, filter' })
  findAll(@Query() query: QueryUsersDto) {
    return this.service.findAll(query);
  }

  // ── Get one ─────────────────────────────────────────────────────────────────
  @Get(':id')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  @Post()
  @RequirePermissions('users:create')
  @ApiOperation({ summary: 'Create a new user' })
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const user = await this.service.create(dto, actor.id);
    return ok(user, 'User created successfully');
  }

  // ── Update own profile (no special permission needed) ──────────────────────
  @Patch('me')
  @ApiOperation({ summary: 'Update own profile — any authenticated user can call this' })
  async updateMe(
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: RequestUser,
  ) {
    // Only allow safe self-editable fields — never let users escalate their own status/role
    const safeDto: UpdateUserDto = {
      firstName: dto.firstName,
      lastName:  dto.lastName,
      jobTitle:  dto.jobTitle,
      phone:     dto.phone,
      timezone:  dto.timezone,
      locale:    dto.locale,
      // Explicitly exclude: status, branchId, departmentId, supervisorId
    };
    const user = await this.service.update(actor.id, safeDto, actor.id);
    return ok(user, 'Profile updated');
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  @Patch(':id')
  @RequirePermissions('users:update')
  @Audit({ action: AuditAction.UPDATE, module: 'users', entityType: 'User', getEntityId: (req) => req.params['id'] })
  @ApiOperation({ summary: 'Update a user' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const user = await this.service.update(id, dto, actor.id);
    return ok(user, 'User updated successfully');
  }

  // ── Soft delete ─────────────────────────────────────────────────────────────
  @Delete(':id')
  @RequirePermissions('users:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a user' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    await this.service.remove(id, actor.id);
    return ok(null, 'User deleted');
  }

  // ── Restore ─────────────────────────────────────────────────────────────────
  @Post(':id/restore')
  @RequirePermissions('users:restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    const user = await this.service.restore(id, actor.id);
    return ok(user, 'User restored');
  }

  // ── Lock ────────────────────────────────────────────────────────────────────
  @Post(':id/lock')
  @RequirePermissions('users:lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock a user account' })
  async lock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() actor: RequestUser,
  ) {
    await this.service.lock(id, actor.id, reason);
    return ok(null, 'User account locked');
  }

  // ── Unlock ──────────────────────────────────────────────────────────────────
  @Post(':id/unlock')
  @RequirePermissions('users:lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock a user account' })
  async unlock(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    await this.service.unlock(id, actor.id);
    return ok(null, 'User account unlocked');
  }

  // ── Admin reset password ────────────────────────────────────────────────────
  @Post(':id/reset-password')
  @RequirePermissions('users:reset_password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: reset a user password' })
  async adminResetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('newPassword') newPassword: string,
    @CurrentUser() actor: RequestUser,
  ) {
    await this.service.adminResetPassword(id, newPassword, actor.id);
    return ok(null, 'Password reset. User must change on next login.');
  }

  // ── Roles ───────────────────────────────────────────────────────────────────
  @Get(':id/roles')
  @RequirePermissions('users:manage_roles')
  @ApiOperation({ summary: "Get user's assigned roles" })
  getUserRoles(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getUserRoles(id);
  }

  @Post(':id/roles')
  @RequirePermissions('users:manage_roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign roles to a user' })
  async assignRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRolesDto,
    @CurrentUser() actor: RequestUser,
  ) {
    await this.service.assignRoles(id, dto, actor.id);
    return ok(null, 'Roles assigned');
  }

  @Delete(':id/roles')
  @RequirePermissions('users:manage_roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke roles from a user' })
  async revokeRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeRolesDto,
    @CurrentUser() actor: RequestUser,
  ) {
    await this.service.revokeRoles(id, dto, actor.id);
    return ok(null, 'Roles revoked');
  }

  // ── Direct permissions ──────────────────────────────────────────────────────
  @Get(':id/permissions')
  @RequirePermissions('users:manage_permissions')
  @ApiOperation({ summary: "Get user's direct permission overrides" })
  getUserPermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getUserPermissions(id);
  }

  @Post(':id/permissions')
  @RequirePermissions('users:manage_permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set direct permission overrides on a user' })
  async assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BulkAssignPermissionsDto,
    @CurrentUser() actor: RequestUser,
  ) {
    await this.service.assignPermissions(id, dto, actor.id);
    return ok(null, 'Permissions updated');
  }

  @Delete(':id/permissions')
  @RequirePermissions('users:manage_permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove direct permission overrides from a user' })
  async revokePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokePermissionsDto,
    @CurrentUser() actor: RequestUser,
  ) {
    await this.service.revokePermissions(id, dto, actor.id);
    return ok(null, 'Permission overrides removed');
  }

  // ── Avatar ──────────────────────────────────────────────────────────────────
  @Post(':id/avatar')
  @RequirePermissions('users:update')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload user avatar' })
  async uploadAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.service.uploadAvatar(id, file, actor.id);
    return ok(result, 'Avatar uploaded');
  }

  // ── Managed branches (for compliance / accounting staff) ─────────────────

  @Get(':id/branches')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get branches this user is assigned to oversee' })
  async getManagedBranches(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getManagedBranches(id));
  }

  @Post(':id/branches')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Assign a branch to a user (for multi-location staff)' })
  async addManagedBranch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('branchId') branchId: string,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.addManagedBranch(id, branchId, actor.id), 'Branch assigned');
  }

  @Delete(':id/branches/:branchId')
  @RequirePermissions('users:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a branch assignment from a user' })
  async removeManagedBranch(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @CurrentUser() actor: RequestUser,
  ) {
    await this.service.removeManagedBranch(id, branchId, actor.id);
    return ok(null, 'Branch assignment removed');
  }
}
