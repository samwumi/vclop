import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { OffboardingService } from './offboarding.service';
import { InitiateOffboardingDto } from './dto/initiate-offboarding.dto';
import {
  RevokeITAccessDto,
  ProcessFinanceClearanceDto,
  ProcessAssetClearanceDto,
  ProcessHRClearanceDto,
} from './dto/process-clearance.dto';
import { OffboardingStatus } from '@prisma/client';

@ApiTags('HR - Offboarding')
@ApiBearerAuth()
@Controller('hr/offboarding')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OffboardingController {
  constructor(private readonly offboardingService: OffboardingService) {}

  /**
   * Initiate offboarding process
   */
  @Post('initiate')
  @RequirePermissions('offboarding:initiate')
  @ApiOperation({ summary: 'Initiate employee offboarding' })
  @ApiResponse({ status: 201, description: 'Offboarding initiated' })
  @ApiResponse({ status: 400, description: 'Already in progress or no active employment' })
  async initiateOffboarding(
    @Body() dto: InitiateOffboardingDto,
    @Request() req: any,
  ) {
    const initiatedById = req.user.userId;

    const offboarding = await this.offboardingService.initiateOffboarding({
      ...dto,
      initiatedById,
    });

    return {
      success: true,
      message: 'Offboarding initiated',
      data: offboarding,
    };
  }

  /**
   * Revoke IT access
   */
  @Post(':id/revoke-it-access')
  @RequirePermissions('offboarding:it_clear')
  @ApiOperation({ summary: 'Revoke IT access (immediate & independent)' })
  @ApiResponse({ status: 200, description: 'IT access revoked' })
  @ApiResponse({ status: 400, description: 'Already revoked' })
  async revokeITAccess(
    @Param('id') id: string,
    @Body() dto: RevokeITAccessDto,
    @Request() req: any,
  ) {
    const revokedById = req.user.userId;

    const offboarding = await this.offboardingService.revokeITAccess(
      id,
      revokedById,
      dto,
    );

    return {
      success: true,
      message: 'IT access revoked and user account suspended',
      data: offboarding,
    };
  }

  /**
   * Process finance clearance
   */
  @Post(':id/finance-clearance')
  @RequirePermissions('offboarding:finance_clear')
  @ApiOperation({ summary: 'Process finance clearance' })
  @ApiResponse({ status: 200, description: 'Finance clearance processed' })
  @ApiResponse({ status: 400, description: 'Already processed or outstanding loans' })
  async processFinanceClearance(
    @Param('id') id: string,
    @Body() dto: ProcessFinanceClearanceDto,
    @Request() req: any,
  ) {
    const clearedById = req.user.userId;

    const offboarding = await this.offboardingService.processFinanceClearance(
      id,
      clearedById,
      dto,
    );

    return {
      success: true,
      message: 'Finance clearance processed',
      data: offboarding,
    };
  }

  /**
   * Process asset clearance
   */
  @Post(':id/asset-clearance')
  @RequirePermissions('offboarding:asset_clear')
  @ApiOperation({ summary: 'Process asset clearance' })
  @ApiResponse({ status: 200, description: 'Asset clearance processed' })
  @ApiResponse({ status: 400, description: 'Already processed' })
  async processAssetClearance(
    @Param('id') id: string,
    @Body() dto: ProcessAssetClearanceDto,
    @Request() req: any,
  ) {
    const clearedById = req.user.userId;

    const offboarding = await this.offboardingService.processAssetClearance(
      id,
      clearedById,
      dto,
    );

    return {
      success: true,
      message: 'Asset clearance processed',
      data: offboarding,
    };
  }

  /**
   * Process HR clearance
   */
  @Post(':id/hr-clearance')
  @RequirePermissions('offboarding:hr_clear')
  @ApiOperation({ summary: 'Process HR clearance' })
  @ApiResponse({ status: 200, description: 'HR clearance processed' })
  @ApiResponse({ status: 400, description: 'Already processed' })
  async processHRClearance(
    @Param('id') id: string,
    @Body() dto: ProcessHRClearanceDto,
    @Request() req: any,
  ) {
    const clearedById = req.user.userId;

    const offboarding = await this.offboardingService.processHRClearance(
      id,
      clearedById,
      dto,
    );

    return {
      success: true,
      message: 'HR clearance processed',
      data: offboarding,
    };
  }

  /**
   * Get offboarding cases
   */
  @Get('cases')
  @RequirePermissions('offboarding:read')
  @ApiOperation({ summary: 'Get offboarding cases' })
  @ApiResponse({ status: 200, description: 'Cases retrieved' })
  async getOffboardingCases(@Query('status') status: OffboardingStatus) {
    const cases = await this.offboardingService.getOffboardingCases(status);

    return {
      success: true,
      data: cases,
    };
  }

  /**
   * Get offboarding details
   */
  @Get(':id')
  @RequirePermissions('offboarding:read')
  @ApiOperation({ summary: 'Get offboarding case details' })
  @ApiResponse({ status: 200, description: 'Details retrieved' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async getOffboardingDetails(@Param('id') id: string) {
    const details = await this.offboardingService.getOffboardingDetails(id);

    return {
      success: true,
      data: details,
    };
  }
}
