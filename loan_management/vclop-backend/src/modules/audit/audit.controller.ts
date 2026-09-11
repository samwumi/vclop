import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('Audit')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'audit', version: '1' })
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Query audit logs with full filtering' })
  findAll(@Query() query: QueryAuditDto) {
    return this.service.findAll(query);
  }

  @Get('stats')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Get audit activity statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getStats(@Query('days') days?: number) {
    return this.service.getStats(days ? Number(days) : 7);
  }

  @Get('modules')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'List all audited modules' })
  getModules() {
    return this.service.getModules();
  }

  @Get(':id')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Get a single audit log entry' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get('entity/:type/:id')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Get full history for a specific entity' })
  getEntityHistory(
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    return this.service.getEntityHistory(type, id);
  }

  @Get('user/:userId/activity')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: "Get a user's recent activity" })
  getUserActivity(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.service.getUserActivity(userId, limit ? Number(limit) : 50);
  }
}
