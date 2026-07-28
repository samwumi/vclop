import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { BulkUpdateSettingsDto, UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { SettingScope } from '@prisma/client';

@ApiTags('Settings')
@Controller({ path: 'settings', version: '1' })
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  // ── Public settings (no auth — used by frontend on boot) ───────────────────
  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get all public settings (no authentication required)' })
  async getPublic() {
    const data = await this.service.getPublicSettings();
    return ok(data, 'Public settings loaded');
  }

  // ── Authenticated routes ────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Get()
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get system settings grouped by category' })
  @ApiQuery({ name: 'group', required: false })
  async getSystem(@Query('group') group?: string) {
    return this.service.getSystemSettings(group);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('groups')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'List all setting groups' })
  getGroups() {
    return this.service.getSystemSettingGroups();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('key/:key')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get a single setting by key' })
  getByKey(@Param('key') key: string) {
    return this.service.getByKey(key);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch('key/:key')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update a single setting by key' })
  async updateByKey(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const setting = await this.service.updateByKey(key, dto, actor.id);
    return ok(setting, 'Setting updated');
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch('bulk')
  @RequirePermissions('settings:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update multiple settings at once' })
  async bulkUpdate(
    @Body() dto: BulkUpdateSettingsDto,
    @CurrentUser() actor: RequestUser,
  ) {
    await this.service.bulkUpdate(dto, actor.id);
    return ok(null, `${dto.settings.length} settings updated`);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('branch/:branchId')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get branch-scoped settings' })
  getBranchSettings(@Param('branchId', ParseUUIDPipe) branchId: string) {
    return this.service.getBranchSettings(branchId);
  }

  // ── Admin: create / delete custom settings ─────────────────────────────────
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Post()
  @RequirePermissions('settings:manage_system')
  @ApiOperation({ summary: 'Create a new setting definition' })
  async create(@Body() dto: CreateSettingDto, @CurrentUser() actor: RequestUser) {
    const setting = await this.service.create(dto, actor.id);
    return ok(setting, 'Setting created');
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @RequirePermissions('settings:manage_system')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a custom setting (non-system settings only)' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    await this.service.delete(id, actor.id);
    return ok(null, 'Setting deleted');
  }
}
