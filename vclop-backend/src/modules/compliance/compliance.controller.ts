import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { WorkflowAction } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { ComplianceService } from './compliance.service';

class AssessmentDto {
  @IsOptional() @IsString() bankStatementNotes?: string;
  @IsOptional() @IsString() incomeAssessment?: string;
  @IsOptional() @IsNumber() affordabilityScore?: number;
  @IsOptional() @IsString() cashFlowAssessment?: string;
  @IsOptional() @IsNumber() riskScore?: number;
  @IsOptional() @IsEnum(WorkflowAction) recommendation?: WorkflowAction;
  @IsOptional() @IsString() recommendationNotes?: string;
  // Verification timestamps — pass ISO string to set, null to clear
  @IsOptional() bvnVerifiedAt?: string | null;
  @IsOptional() ninVerifiedAt?: string | null;
  @IsOptional() phoneVerifiedAt?: string | null;
  @IsOptional() employerVerifiedAt?: string | null;
  @IsOptional() businessVerifiedAt?: string | null;
  @IsOptional() residenceVerifiedAt?: string | null;
}
class FieldVisitDto {
  @IsString() visitType!: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsDateString() arrivedAt?: string;
  @IsOptional() @IsDateString() completedAt?: string;
  @IsOptional() @IsString() findings?: string;
  @IsOptional() @IsString() photos?: string;
}

@ApiTags('Compliance') @ApiBearerAuth('JWT-auth') @UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'compliance', version: '1' })
export class ComplianceController {
  constructor(private readonly service: ComplianceService) {}
  @Get('queue') @RequirePermissions('loan_applications:compliance_review')
  async queue(@CurrentUser() user: RequestUser) {
    // Build list of all branches this compliance officer covers:
    // - Their primary branchId
    // - All additional branches from UserBranch table (managedBranchIds)
    const allBranchIds = [
      ...(user.branchId ? [user.branchId] : []),
      ...(user.managedBranchIds ?? []),
    ];
    // Unique, deduplicated
    const uniqueBranchIds = [...new Set(allBranchIds)];
    // If no branches assigned → HQ/non-location role → see everything
    const isHQ = uniqueBranchIds.length === 0;
    return this.service.queue(uniqueBranchIds, isHQ);
  }
  @Get('applications/:id/assessment') @RequirePermissions('loan_applications:compliance_review') assessment(@Param('id', ParseUUIDPipe) id: string) { return this.service.assessment(id); }
  @Put('applications/:id/assessment') @RequirePermissions('loan_applications:compliance_review') async save(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssessmentDto, @CurrentUser() user: RequestUser) { return ok(await this.service.saveAssessment(id, dto, user.id)); }
  @Get('applications/:id/field-visits') @RequirePermissions('loan_applications:compliance_review') visits(@Param('id', ParseUUIDPipe) id: string) { return this.service.listVisits(id); }
  @Post('applications/:id/field-visits') @RequirePermissions('loan_applications:compliance_review') async addVisit(@Param('id', ParseUUIDPipe) id: string, @Body() dto: FieldVisitDto, @CurrentUser() user: RequestUser) { return ok(await this.service.addVisit(id, dto, user.id)); }

  // ── Customer-level KYC field visits ───────────────────────────────────────
  @Get('customers/:customerId/field-visits') @RequirePermissions('loan_applications:compliance_review')
  customerVisits(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.service.listCustomerVisits(customerId);
  }

  @Post('customers/:customerId/field-visits') @RequirePermissions('loan_applications:compliance_review')
  async addCustomerVisit(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: FieldVisitDto,
    @CurrentUser() user: RequestUser,
  ) {
    return ok(await this.service.addCustomerVisit(customerId, dto, user.id));
  }
}
