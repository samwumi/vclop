import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { SaveLayoutDto, UpdateLayoutDto } from './dto/dashboard.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  // ────────────────────────────────────────────────────────────────────────────
  // BOOTSTRAP — frontend calls this once after login
  // ────────────────────────────────────────────────────────────────────────────

  @Get()
  @RequirePermissions('dashboard:read')
  @ApiOperation({
    summary: 'Load user dashboard — returns authorized widgets and saved layout',
  })
  async getUserDashboard(@CurrentUser() user: RequestUser) {
    const dashboard = await this.service.getUserDashboard(user);
    return ok(dashboard, 'Dashboard loaded');
  }

  @Get('operational-summary')
  @RequirePermissions('dashboard:read')
  @ApiOperation({ summary: 'Permission-scoped operational KPIs and approval queues for the current user' })
  async getOperationalSummary(@CurrentUser() user: RequestUser) {
    return ok(await this.service.getOperationalSummary(user), 'Operational dashboard loaded');
  }

  // ────────────────────────────────────────────────────────────────────────────
  // LAYOUTS
  // ────────────────────────────────────────────────────────────────────────────

  @Get('layouts')
  @RequirePermissions('dashboard:read')
  @ApiOperation({ summary: "Get all of the current user's saved layouts" })
  getLayouts(@CurrentUser() user: RequestUser) {
    return this.service.getUserLayouts(user.id);
  }

  @Post('layouts')
  @RequirePermissions('dashboard:customize')
  @ApiOperation({ summary: 'Save a new dashboard layout' })
  async saveLayout(@Body() dto: SaveLayoutDto, @CurrentUser() user: RequestUser) {
    const layout = await this.service.saveLayout(user.id, dto);
    return ok(layout, 'Layout saved');
  }

  @Patch('layouts/:id')
  @RequirePermissions('dashboard:customize')
  @ApiOperation({ summary: 'Update a saved layout' })
  async updateLayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLayoutDto,
    @CurrentUser() user: RequestUser,
  ) {
    const layout = await this.service.updateLayout(user.id, id, dto);
    return ok(layout, 'Layout updated');
  }

  @Delete('layouts/:id')
  @RequirePermissions('dashboard:customize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved layout' })
  async deleteLayout(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    await this.service.deleteLayout(user.id, id);
    return ok(null, 'Layout deleted');
  }

  // ────────────────────────────────────────────────────────────────────────────
  // WIDGET CATALOG (admin)
  // ────────────────────────────────────────────────────────────────────────────

  @Get('widgets')
  @RequirePermissions('dashboard:manage_widgets')
  @ApiOperation({ summary: 'Get all registered widgets (admin)' })
  getAllWidgets() {
    return this.service.getAllWidgets();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // WIDGET DATA ENDPOINTS — each widget fetches its own data
  // ────────────────────────────────────────────────────────────────────────────

  @Get('stats/active-users')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Widget data: active users statistics' })
  getActiveUsers() {
    return this.service.getActiveUsersStats();
  }

  @Get('stats/total-branches')
  @RequirePermissions('branches:read')
  @ApiOperation({ summary: 'Widget data: total branches' })
  getTotalBranches() {
    return this.service.getTotalBranchesStats();
  }

  @Get('stats/total-departments')
  @RequirePermissions('departments:read')
  @ApiOperation({ summary: 'Widget data: total departments' })
  getTotalDepartments() {
    return this.service.getTotalDepartmentsStats();
  }

  @Get('stats/user-status')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Widget data: user status distribution chart' })
  getUserStatusChart() {
    return this.service.getUserStatusChart();
  }

  @Get('stats/login-activity')
  @RequirePermissions('audit:read')
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiOperation({ summary: 'Widget data: login activity over N days' })
  getLoginActivity(@Query('days') days?: number) {
    return this.service.getLoginActivityChart(days ? Number(days) : 7);
  }

  @Get('widgets/recent-audit')
  @RequirePermissions('audit:read')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Widget data: recent audit log entries' })
  getRecentAudit(@Query('limit') limit?: number) {
    return this.service.getRecentAuditLogs(limit ? Number(limit) : 10);
  }

  @Get('stats/health')
  @RequirePermissions('system:health')
  @ApiOperation({ summary: 'Widget data: system health check' })
  getHealth() {
    return this.service.getSystemHealth();
  }
}
