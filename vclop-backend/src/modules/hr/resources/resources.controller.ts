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
import { ResourcesService } from './resources.service';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { AssignOwnershipDto } from './dto/assign-ownership.dto';
import { ResourceType, DelegationStatus } from '@prisma/client';

@ApiTags('HR - Resources & Responsibilities')
@ApiBearerAuth()
@Controller('hr/resources')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  /**
   * Get effective handler for a resource
   */
  @Get('effective-handler/:resourceType/:resourceId')
  @RequirePermissions('resources:read')
  @ApiOperation({ summary: 'Get effective handler for a resource' })
  @ApiResponse({ status: 200, description: 'Handler retrieved' })
  async getEffectiveHandler(
    @Param('resourceType') resourceType: ResourceType,
    @Param('resourceId') resourceId: string,
  ) {
    const handler = await this.resourcesService.getEffectiveHandler(
      resourceType,
      resourceId,
    );

    return {
      success: true,
      data: handler,
    };
  }

  /**
   * Assign permanent ownership
   */
  @Post('assign-ownership')
  @RequirePermissions('resources:assign')
  @ApiOperation({ summary: 'Assign or reassign permanent resource ownership' })
  @ApiResponse({ status: 201, description: 'Ownership assigned' })
  async assignOwnership(@Body() dto: AssignOwnershipDto, @Request() req: any) {
    const assignedById = req.user.userId;

    const ownership = await this.resourcesService.assignOwnership({
      ...dto,
      assignedById,
    });

    return {
      success: true,
      message: 'Resource ownership assigned',
      data: ownership,
    };
  }

  /**
   * Create temporary delegation
   */
  @Post('delegate')
  @RequirePermissions('resources:delegate')
  @ApiOperation({ summary: 'Create temporary resource delegation' })
  @ApiResponse({ status: 201, description: 'Delegation created' })
  @ApiResponse({ status: 400, description: 'Not owner or conflicting delegation' })
  async createDelegation(@Body() dto: CreateDelegationDto, @Request() req: any) {
    const delegatedFrom = req.user.userId;

    const delegation = await this.resourcesService.createDelegation({
      ...dto,
      delegatedFrom,
      permissions: {
        canRead: dto.canRead,
        canUpdate: dto.canUpdate,
        canApproveLoans: dto.canApproveLoans,
        canDisburse: dto.canDisburse,
        canCollect: dto.canCollect,
      },
    });

    return {
      success: true,
      message: 'Delegation created, awaiting acceptance',
      data: delegation,
    };
  }

  /**
   * Accept delegation
   */
  @Post('delegations/:id/accept')
  @RequirePermissions('resources:accept')
  @ApiOperation({ summary: 'Accept resource delegation' })
  @ApiResponse({ status: 200, description: 'Delegation accepted' })
  @ApiResponse({ status: 400, description: 'Not the delegate or already processed' })
  async acceptDelegation(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    const delegation = await this.resourcesService.respondToDelegation(
      id,
      userId,
      true,
      body.notes,
    );

    return {
      success: true,
      message: 'Delegation accepted',
      data: delegation,
    };
  }

  /**
   * Reject delegation
   */
  @Post('delegations/:id/reject')
  @RequirePermissions('resources:accept')
  @ApiOperation({ summary: 'Reject resource delegation' })
  @ApiResponse({ status: 200, description: 'Delegation rejected' })
  @ApiResponse({ status: 400, description: 'Not the delegate or already processed' })
  async rejectDelegation(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    const delegation = await this.resourcesService.respondToDelegation(
      id,
      userId,
      false,
      body.notes,
    );

    return {
      success: true,
      message: 'Delegation rejected',
      data: delegation,
    };
  }

  /**
   * Revoke delegation
   */
  @Post('delegations/:id/revoke')
  @RequirePermissions('resources:delegate')
  @ApiOperation({ summary: 'Revoke resource delegation' })
  @ApiResponse({ status: 200, description: 'Delegation revoked' })
  @ApiResponse({ status: 400, description: 'Cannot revoke' })
  async revokeDelegation(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    const revokedById = req.user.userId;

    const delegation = await this.resourcesService.revokeDelegation(
      id,
      revokedById,
      body.reason,
    );

    return {
      success: true,
      message: 'Delegation revoked',
      data: delegation,
    };
  }

  /**
   * Get my resources
   */
  @Get('my-resources')
  @RequirePermissions('resources:read')
  @ApiOperation({ summary: 'Get my assigned resources' })
  @ApiResponse({ status: 200, description: 'Resources retrieved' })
  async getMyResources(
    @Query('includeHistory') includeHistory: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    const history = includeHistory === 'true';

    const resources = await this.resourcesService.getMyResources(userId, history);

    return {
      success: true,
      data: resources,
    };
  }

  /**
   * Get delegations sent by me
   */
  @Get('delegations/sent')
  @RequirePermissions('resources:read')
  @ApiOperation({ summary: 'Get delegations I have sent' })
  @ApiResponse({ status: 200, description: 'Delegations retrieved' })
  async getSentDelegations(
    @Query('status') status: DelegationStatus,
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    const delegations = await this.resourcesService.getDelegations(
      userId,
      'sent',
      status,
    );

    return {
      success: true,
      data: delegations,
    };
  }

  /**
   * Get delegations received by me
   */
  @Get('delegations/received')
  @RequirePermissions('resources:read')
  @ApiOperation({ summary: 'Get delegations I have received' })
  @ApiResponse({ status: 200, description: 'Delegations retrieved' })
  async getReceivedDelegations(
    @Query('status') status: DelegationStatus,
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    const delegations = await this.resourcesService.getDelegations(
      userId,
      'received',
      status,
    );

    return {
      success: true,
      data: delegations,
    };
  }

  /**
   * Get resource history
   */
  @Get('history/:resourceType/:resourceId')
  @RequirePermissions('resources:read')
  @ApiOperation({ summary: 'Get ownership and delegation history for a resource' })
  @ApiResponse({ status: 200, description: 'History retrieved' })
  async getResourceHistory(
    @Param('resourceType') resourceType: ResourceType,
    @Param('resourceId') resourceId: string,
  ) {
    const history = await this.resourcesService.getResourceHistory(
      resourceType,
      resourceId,
    );

    return {
      success: true,
      data: history,
    };
  }
}
