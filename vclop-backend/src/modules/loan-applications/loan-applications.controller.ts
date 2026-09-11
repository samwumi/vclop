import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { LoanApplicationsService } from './loan-applications.service';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { AddCollateralDto, AddGuarantorDto, UpdateGuarantorDto } from './dto/guarantor-collateral.dto';
import { QueryLoanApplicationsDto } from './dto/query-loan-applications.dto';
import { RecordRepaymentDto, ReviewLoanApplicationDto } from './dto/review-and-repayment.dto';

@ApiTags('Loan Applications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'loan-applications', version: '1' })
export class LoanApplicationsController {
  constructor(private readonly service: LoanApplicationsService) {}

  @Get()
  @RequirePermissions('loan_applications:read')
  @ApiOperation({ summary: 'List/search loan applications' })
  findAll(@Query() query: QueryLoanApplicationsDto, @CurrentUser() actor: RequestUser) {
    const isAdmin = actor.permissions.has('system:admin');
    const canViewAll =
      isAdmin ||
      actor.permissions.has('loan_applications:compliance_review') ||
      actor.permissions.has('loan_applications:internal_control_approve') ||
      actor.permissions.has('loan_applications:disburse_head');

    // Regular accountants: scope to their primary branch only
    const isAccountant =
      !isAdmin &&
      actor.permissions.has('loan_applications:disburse') &&
      !actor.permissions.has('loan_applications:disburse_head');

    if (!canViewAll && !isAccountant && !query.submittedById) {
      // Loan officer — see only own submissions
      query.submittedById = actor.id;
    }

    if (isAccountant && actor.branchId && !query.branchId) {
      query.branchId = actor.branchId;
    }

    // Pass actorId to enable location-based filtering for compliance/IC officers
    return this.service.findAll(query, actor.id);
  }

  @Get(':id')
  @RequirePermissions('loan_applications:read')
  @ApiOperation({ summary: 'Get a loan application — includes guarantors, collateral, and the resulting loan/schedule once disbursed' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('loan_applications:create')
  @ApiOperation({ summary: 'Create a loan application (starts as DRAFT) — validates customer eligibility and product amount/tenure range' })
  async create(@Body() dto: CreateLoanApplicationDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.create(dto, actor.id), 'Loan application created');
  }

  @Post(':id/guarantors')
  @RequirePermissions('loan_applications:update')
  @ApiOperation({ summary: 'Add a guarantor to a loan application' })
  async addGuarantor(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddGuarantorDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.addGuarantor(id, dto, actor.id), 'Guarantor added');
  }

  @Patch(':id/guarantors/:guarantorId')
  @RequirePermissions('loan_applications:update')
  @ApiOperation({ summary: 'Update a guarantor on a loan application' })
  async updateGuarantor(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('guarantorId', ParseUUIDPipe) guarantorId: string,
    @Body() dto: UpdateGuarantorDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.updateGuarantor(id, guarantorId, dto, actor.id), 'Guarantor updated');
  }

  @Delete(':id/guarantors/:guarantorId')
  @RequirePermissions('loan_applications:update')
  @ApiOperation({ summary: 'Remove a guarantor from a loan application' })
  async removeGuarantor(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('guarantorId', ParseUUIDPipe) guarantorId: string,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.removeGuarantor(id, guarantorId, actor.id), 'Guarantor removed');
  }

  @Post(':id/collaterals')
  @RequirePermissions('loan_applications:update')
  @ApiOperation({ summary: 'Add collateral to a DRAFT application' })
  async addCollateral(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddCollateralDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.addCollateral(id, dto, actor.id), 'Collateral added');
  }

  @Patch(':id/submit')
  @RequirePermissions('loan_applications:submit')
  @ApiOperation({ summary: 'Submit a DRAFT application for review — checks guarantor/collateral and document requirements' })
  async submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.submit(id, actor.id), 'Application submitted');
  }

  @Patch(':id/review')
  @RequirePermissions('loan_applications:compliance_review')
  @ApiOperation({ summary: 'Approve or reject a SUBMITTED application' })
  async review(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewLoanApplicationDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.review(id, dto, actor), 'Review recorded');
  }

  @Patch(':id/disburse')
  @RequirePermissions('loan_applications:disburse_head')
  @ApiOperation({ summary: 'Disburse an APPROVED application — Accounting Head only' })
  async disburse(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.disburse(id, actor.id), 'Loan disbursed');
  }

  @Post('loans/:loanId/repayments')
  @RequirePermissions('loan_applications:record_repayment')
  @ApiOperation({ summary: 'Record a repayment against a disbursed loan' })
  async recordRepayment(@Param('loanId', ParseUUIDPipe) loanId: string, @Body() dto: RecordRepaymentDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.recordRepayment(loanId, dto, actor.id), 'Repayment recorded');
  }

  @Get('export/csv')
  @RequirePermissions('loan_applications:read')
  @ApiOperation({ summary: 'Export loan applications as CSV' })
  async exportCsv(@Query() query: QueryLoanApplicationsDto, @CurrentUser() actor: RequestUser, @Res() res: Response) {
    const isAdmin = actor.permissions.has('system:admin');
    const canViewAll =
      isAdmin ||
      actor.permissions.has('loan_applications:compliance_review') ||
      actor.permissions.has('loan_applications:internal_control_approve') ||
      actor.permissions.has('loan_applications:disburse_head');

    if (!canViewAll && !query.submittedById) {
      query.submittedById = actor.id;
    }

    const csv = await this.service.exportCsv(query, actor.id);
    const today = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="loan-applications-${today}.csv"`,
    });
    res.send(csv);
  }

  // ── IC / reviewer read endpoints ─────────────────────────────────────────
  // These sit under loan_applications:read so every reviewer role (IC, compliance,
  // AcctHead, admin) can fetch compliance data without needing compliance_review perm.
  // This is the authoritative path for IC — bypasses the compliance controller entirely.

  @Get(':id/compliance-assessment')
  @RequirePermissions('loan_applications:read')
  @ApiOperation({ summary: 'Get compliance assessment for a loan application (IC, compliance, AcctHead, admin)' })
  async getComplianceAssessment(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getComplianceAssessment(id);
  }

  @Get(':id/field-visits')
  @RequirePermissions('loan_applications:read')
  @ApiOperation({ summary: 'Get all field visits for a loan application including KYC visits from same customer' })
  async getFieldVisits(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getFieldVisitsForApplication(id);
  }
}
