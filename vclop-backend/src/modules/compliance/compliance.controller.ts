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

// Permission used for READ-ONLY access — compliance officers AND internal control
const READ_PERM = 'loan_applications:read';

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
    const allBranchIds = [
      ...(user.branchId ? [user.branchId] : []),
      ...(user.managedBranchIds ?? []),
    ];
    const uniqueBranchIds = [...new Set(allBranchIds)];
    const isHQ = uniqueBranchIds.length === 0;
    return this.service.queue(uniqueBranchIds, isHQ);
  }

  // ── READ endpoints: accessible by compliance AND IC (and admin via loan_applications:read) ──

  @Get('applications/:id/assessment')
  @RequirePermissions(READ_PERM)
  assessment(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.assessment(id);
  }

  @Get('applications/:id/field-visits')
  @RequirePermissions(READ_PERM)
  visits(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.listVisits(id);
  }

  @Get('customers/:customerId/field-visits')
  @RequirePermissions(READ_PERM)
  customerVisits(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.service.listCustomerVisits(customerId);
  }

  // ── WRITE endpoints: compliance only ──────────────────────────────────────

  @Put('applications/:id/assessment')
  @RequirePermissions('loan_applications:compliance_review')
  async save(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssessmentDto, @CurrentUser() user: RequestUser) {
    return ok(await this.service.saveAssessment(id, dto, user.id));
  }

  @Post('applications/:id/field-visits')
  @RequirePermissions('loan_applications:compliance_review')
  async addVisit(@Param('id', ParseUUIDPipe) id: string, @Body() dto: FieldVisitDto, @CurrentUser() user: RequestUser) {
    return ok(await this.service.addVisit(id, dto, user.id));
  }

  @Post('customers/:customerId/field-visits')
  @RequirePermissions('loan_applications:compliance_review')
  async addCustomerVisit(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: FieldVisitDto,
    @CurrentUser() user: RequestUser,
  ) {
    return ok(await this.service.addCustomerVisit(customerId, dto, user.id));
  }
}
