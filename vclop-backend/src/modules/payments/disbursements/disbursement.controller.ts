import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DisbursementService } from './disbursement.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { RequirePermissions } from '../../../decorators/permissions.decorator';
import { DisbursementEntityType } from '@prisma/client';

@Controller('disbursements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DisbursementController {
  constructor(private readonly disbursementService: DisbursementService) {}

  /**
   * Get all pending disbursements (admin)
   */
  @Get('pending')
  @RequirePermissions('DISBURSEMENTS:VIEW')
  async getPending(@Query('entityType') entityType?: DisbursementEntityType) {
    const disbursements = await this.disbursementService.getPendingDisbursements(entityType);
    return {
      success: true,
      data: disbursements,
    };
  }

  /**
   * Get all failed disbursements (admin)
   */
  @Get('failed')
  @RequirePermissions('DISBURSEMENTS:VIEW')
  async getFailed(@Query('entityType') entityType?: DisbursementEntityType) {
    const disbursements = await this.disbursementService.getFailedDisbursements(entityType);
    return {
      success: true,
      data: disbursements,
    };
  }

  /**
   * Get specific disbursement details
   */
  @Get(':id')
  @RequirePermissions('DISBURSEMENTS:VIEW')
  async getOne(@Param('id') id: string) {
    const disbursement = await this.disbursementService.getDisbursement(id);
    return {
      success: true,
      data: disbursement,
    };
  }

  /**
   * Retry failed disbursement
   */
  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('DISBURSEMENTS:RETRY')
  async retry(@Param('id') id: string) {
    const disbursement = await this.disbursementService.retryDisbursement(id);
    return {
      success: true,
      data: disbursement,
      message: 'Disbursement retry initiated',
    };
  }

  /**
   * Get disbursements for specific entity (e.g., all disbursements for a loan)
   */
  @Get('entity/:entityType/:entityId')
  @RequirePermissions('DISBURSEMENTS:VIEW')
  async getForEntity(
    @Param('entityType') entityType: DisbursementEntityType,
    @Param('entityId') entityId: string,
  ) {
    const disbursements = await this.disbursementService.getDisbursementsForEntity(
      entityType,
      entityId,
    );
    return {
      success: true,
      data: disbursements,
    };
  }
}
