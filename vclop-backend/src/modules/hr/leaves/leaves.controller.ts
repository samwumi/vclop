import {
  Controller,
  Get,
  Post,
  Put,
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
import { LeavesService } from './leaves.service';
import { LeaveApprovalService } from './leave-approval.service';
import { CreateLeaveApplicationDto } from './dto/create-leave-application.dto';
import { CancelLeaveApplicationDto } from './dto/cancel-leave-application.dto';
import { ApproveLeaveDto } from './dto/approve-leave.dto';
import { LeaveStatus } from '@prisma/client';

@ApiTags('HR - Leaves')
@ApiBearerAuth()
@Controller('hr/leaves')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeavesController {
  constructor(
    private readonly leavesService: LeavesService,
    private readonly leaveApprovalService: LeaveApprovalService,
  ) {}

  /**
   * Create a new leave application (draft)
   */
  @Post('apply')
  @RequirePermissions('leaves:create')
  @ApiOperation({ summary: 'Create a new leave application' })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createApplication(
    @Body() dto: CreateLeaveApplicationDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    const application = await this.leavesService.createLeaveApplication({
      ...dto,
      userId,
    });

    return {
      success: true,
      message: 'Leave application created',
      data: application,
    };
  }

  /**
   * Submit leave application for approval
   */
  @Post(':id/submit')
  @RequirePermissions('leaves:create')
  @ApiOperation({ summary: 'Submit leave application for approval' })
  @ApiResponse({ status: 200, description: 'Application submitted successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid status' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async submitApplication(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId;

    // Submit application (with balance check)
    const application = await this.leavesService.submitLeaveApplication(id, userId);

    // Create approval requests
    const approvalResult = await this.leaveApprovalService.createApprovalRequests(id);

    return {
      success: true,
      message: approvalResult.autoApproved
        ? 'Application auto-approved'
        : 'Application submitted for approval',
      data: {
        application,
        approvals: approvalResult.autoApproved ? null : approvalResult.approvals,
      },
    };
  }

  /**
   * Cancel leave application
   */
  @Post(':id/cancel')
  @RequirePermissions('leaves:create')
  @ApiOperation({ summary: 'Cancel a leave application' })
  @ApiResponse({ status: 200, description: 'Application cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel in current status' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async cancelApplication(
    @Param('id') id: string,
    @Body() dto: CancelLeaveApplicationDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    const application = await this.leavesService.cancelLeaveApplication(
      id,
      userId,
      dto.reason,
    );

    return {
      success: true,
      message: 'Leave application cancelled',
      data: application,
    };
  }

  /**
   * Get my leave applications
   */
  @Get('my-applications')
  @RequirePermissions('leaves:read')
  @ApiOperation({ summary: 'Get my leave applications' })
  @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
  async getMyApplications(
    @Query('status') status: LeaveStatus,
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    const applications = await this.leavesService.getMyApplications(userId, status);

    return {
      success: true,
      data: applications,
    };
  }

  /**
   * Get my leave balance for a specific year and leave type
   */
  @Get('my-balance/:year/:leaveTypeId')
  @RequirePermissions('leaves:read')
  @ApiOperation({ summary: 'Get my leave balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getMyBalance(
    @Param('year') year: string,
    @Param('leaveTypeId') leaveTypeId: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    const yearNum = parseInt(year, 10);

    const balance = await this.leavesService.getMyBalance(userId, yearNum);

    return {
      success: true,
      data: balance,
    };
  }

  /**
   * Get all my balances for a year
   */
  @Get('my-balance/:year')
  @RequirePermissions('leaves:read')
  @ApiOperation({ summary: 'Get all my leave balances for a year' })
  @ApiResponse({ status: 200, description: 'Balances retrieved successfully' })
  async getAllMyBalances(@Param('year') year: string, @Request() req: any) {
    const userId = req.user.userId;
    const yearNum = parseInt(year, 10);

    const balances = await this.leavesService.getMyBalance(userId, yearNum);

    return {
      success: true,
      data: balances,
    };
  }

  /**
   * Get pending approvals assigned to me
   */
  @Get('pending-approvals')
  @RequirePermissions('leaves:approve')
  @ApiOperation({ summary: 'Get pending leave approvals assigned to me' })
  @ApiResponse({ status: 200, description: 'Pending approvals retrieved successfully' })
  async getPendingApprovals(@Request() req: any) {
    const userId = req.user.userId;

    const approvals = await this.leaveApprovalService.getPendingApprovals(userId);

    return {
      success: true,
      data: approvals,
    };
  }

  /**
   * Process approval decision
   */
  @Post('approvals/:id/decide')
  @RequirePermissions('leaves:approve')
  @ApiOperation({ summary: 'Approve or reject a leave application' })
  @ApiResponse({ status: 200, description: 'Decision processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid decision or unauthorized' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  async processApproval(
    @Param('id') id: string,
    @Body() dto: ApproveLeaveDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    const result = await this.leaveApprovalService.processApprovalDecision(
      id,
      userId,
      dto.decision,
      dto.comments,
    );

    return {
      success: true,
      message: result.message,
      data: result,
    };
  }

  /**
   * Get approval history for an application
   */
  @Get(':id/approval-history')
  @RequirePermissions('leaves:read')
  @ApiOperation({ summary: 'Get approval history for a leave application' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  async getApprovalHistory(@Param('id') id: string) {
    const history = await this.leaveApprovalService.getApprovalHistory(id);

    return {
      success: true,
      data: history,
    };
  }

  /**
   * Get specific leave application details
   */
  @Get(':id')
  @RequirePermissions('leaves:read')
  @ApiOperation({ summary: 'Get leave application details' })
  @ApiResponse({ status: 200, description: 'Application retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async getApplication(@Param('id') id: string) {
    const application = await this.leavesService.getMyApplications(id, undefined);

    return {
      success: true,
      data: application,
    };
  }
}
