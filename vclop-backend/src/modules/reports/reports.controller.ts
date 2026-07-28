import { Controller, Get, Param, ParseUUIDPipe, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { ReportsService } from './reports.service';

class DateRangeDto {
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsUUID() branchId?: string;
}

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  // ── Existing ────────────────────────────────────────────────────────────

  @Get('portfolio')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Portfolio overview' })
  async portfolio(@CurrentUser() user: RequestUser) {
    return ok(await this.service.portfolio(user.id));
  }

  @Get('disbursements')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Disbursement report with optional date range' })
  async disbursements(@Query() query: DateRangeDto, @CurrentUser() user: RequestUser) {
    return ok(await this.service.disbursements(
      user.id,
      query.from ? new Date(query.from) : undefined,
      query.to   ? new Date(query.to)   : undefined,
    ));
  }

  @Get('collections')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Collections and overdue installments' })
  async collections(@CurrentUser() user: RequestUser) {
    return ok(await this.service.collections(user.id));
  }

  // ── New endpoints ────────────────────────────────────────────────────────

  @Get('location-summary')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Performance KPIs for every active location branch' })
  async locationSummary(@CurrentUser() user: RequestUser) {
    return ok(await this.service.locationSummary(user.id));
  }

  @Get('officer-performance')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'MTD performance per loan officer with target progress' })
  async officerPerformance(@Query() query: DateRangeDto, @CurrentUser() user: RequestUser) {
    return ok(await this.service.officerPerformance(
      user.id,
      query.from ? new Date(query.from) : undefined,
      query.to   ? new Date(query.to)   : undefined,
      query.branchId,
    ));
  }

  @Get('par-by-location')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Portfolio At Risk percentage grouped by location' })
  async parByLocation(@CurrentUser() user: RequestUser) {
    return ok(await this.service.parByLocation(user.id));
  }

  @Get('location/:branchId')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Full drilldown for a specific location: officers, customers, disbursements, bad loans' })
  async locationDrilldown(
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Query() query: DateRangeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return ok(await this.service.locationDrilldown(
      branchId,
      user.id,
      query.from ? new Date(query.from) : undefined,
      query.to   ? new Date(query.to)   : undefined,
    ));
  }

  // ── Excel exports ────────────────────────────────────────────────────────

  @Get('export/location-summary')
  @RequirePermissions('reports:export')
  @ApiOperation({ summary: 'Export location summary as Excel' })
  async exportLocationSummary(@CurrentUser() user: RequestUser, @Res() res: Response) {
    const buffer = await this.service.exportLocationSummary(user.id);
    res.set({
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="location-summary-${this.today()}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('export/officer-performance')
  @RequirePermissions('reports:export')
  @ApiOperation({ summary: 'Export officer performance as Excel' })
  async exportOfficerPerformance(@Query() query: DateRangeDto, @CurrentUser() user: RequestUser, @Res() res: Response) {
    const buffer = await this.service.exportOfficerPerformance(
      user.id,
      query.from ? new Date(query.from) : undefined,
      query.to   ? new Date(query.to)   : undefined,
      query.branchId,
    );
    res.set({
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="officer-performance-${this.today()}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('export/disbursements')
  @RequirePermissions('reports:export')
  @ApiOperation({ summary: 'Export disbursements as Excel' })
  async exportDisbursements(@Query() query: DateRangeDto, @CurrentUser() user: RequestUser, @Res() res: Response) {
    const buffer = await this.service.exportDisbursements(
      user.id,
      query.from ? new Date(query.from) : undefined,
      query.to   ? new Date(query.to)   : undefined,
    );
    res.set({
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="disbursements-${this.today()}.xlsx"`,
    });
    res.send(buffer);
  }

  private today() {
    return new Date().toISOString().split('T')[0];
  }
}
