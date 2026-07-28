import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PermissionCategory } from '@prisma/client';

@ApiTags('Permissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'permissions', version: '1' })
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get()
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'List all permissions with pagination' })
  @ApiQuery({ name: 'category', enum: PermissionCategory, required: false })
  @ApiQuery({ name: 'module', required: false })
  findAll(@Query() query: PaginationDto & { category?: PermissionCategory; module?: string }) {
    return this.service.findAll(query);
  }

  @Get('grouped')
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get all permissions grouped by category' })
  findGrouped() {
    return this.service.findAllGrouped();
  }

  @Get('modules')
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'List all permission modules' })
  findModules() {
    return this.service.findModules();
  }
}
