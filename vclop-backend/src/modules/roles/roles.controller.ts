import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SyncPermissionsDto } from './dto/sync-permissions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ok } from '../../common/utils/response.util';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'roles', version: '1' })
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'List all roles with their permissions' })
  findAll(@Query() query: PaginationDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('roles:create')
  @ApiOperation({ summary: 'Create a new role' })
  async create(@Body() dto: CreateRoleDto, @CurrentUser() actor: RequestUser) {
    const role = await this.service.create(dto, actor.id);
    return ok(role, 'Role created');
  }

  @Patch(':id')
  @RequirePermissions('roles:update')
  @ApiOperation({ summary: 'Update a role' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const role = await this.service.update(id, dto, actor.id);
    return ok(role, 'Role updated');
  }

  @Delete(':id')
  @RequirePermissions('roles:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a role (only if no users assigned)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    await this.service.remove(id, actor.id);
    return ok(null, 'Role deleted');
  }

  @Post(':id/permissions/sync')
  @RequirePermissions('roles:manage_permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync (replace) all permissions on a role' })
  async syncPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SyncPermissionsDto,
    @CurrentUser() actor: RequestUser,
  ) {
    await this.service.syncPermissions(id, dto, actor.id);
    return ok(null, 'Role permissions synced');
  }

  @Post(':id/permissions')
  @RequirePermissions('roles:manage_permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add permissions to a role' })
  async addPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('permissionIds') permissionIds: string[],
    @CurrentUser() actor: RequestUser,
  ) {
    await this.service.addPermissions(id, permissionIds, actor.id);
    return ok(null, 'Permissions added');
  }

  @Delete(':id/permissions')
  @RequirePermissions('roles:manage_permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove permissions from a role' })
  async removePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('permissionIds') permissionIds: string[],
    @CurrentUser() actor: RequestUser,
  ) {
    await this.service.removePermissions(id, permissionIds, actor.id);
    return ok(null, 'Permissions removed');
  }
}
