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
  @ApiOperation({ summary: 'Get daily reconciliation summary for a given date' })
  async summary(@Query('date') date?: string) {
    return ok(await this.service.getSummary(date), 'Reconciliation summary retrieved');
  }

  @Get('discrepancies')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Get list of payment discrepancies for a given date' })
  async discrepancies(@Query('date') date?: string) {
    return ok(await this.service.getDiscrepancies(date), 'Discrepancies retrieved');
  }

  @Get('unmatched')
  @RequirePermissions('virtual_accounts:reconcile')
  @ApiOperation({ summary: 'Get unmatched transactions (payments that could not be automatically linked to a loan)' })
  async unmatched(@Query('date') date?: string) {
    return ok(await this.service.getUnmatched(date), 'Unmatched transactions retrieved');
  }
}
