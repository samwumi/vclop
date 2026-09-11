import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ok } from '../../common/utils/response.util';
import { ReconciliationService } from './reconciliation.service';

@ApiTags('Reconciliation')
@Controller({ path: 'reconciliation', version: '1' })
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReconciliationController {
  constructor(private readonly service: ReconciliationService) {}

  @Get('summary')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Get reconciliation summary with optional date range and grouping' })
  async summary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return ok(await this.service.getSummary(startDate, endDate, groupBy), 'Reconciliation summary retrieved');
  }

  @Get('discrepancies')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Get list of payment discrepancies for a date range' })
  async discrepancies(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return ok(await this.service.getDiscrepancies(startDate, endDate), 'Discrepancies retrieved');
  }

  @Get('unmatched')
  @RequirePermissions('virtual_accounts:reconcile')
  @ApiOperation({ summary: 'Get unmatched transactions for a date range' })
  async unmatched(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return ok(await this.service.getUnmatched(startDate, endDate), 'Unmatched transactions retrieved');
  }
}
