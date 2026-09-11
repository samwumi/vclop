import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { LoanApplicationsService } from './loan-applications.service';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { AddCollateralDto, AddGuarantorDto } from './dto/guarantor-collateral.dto';
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
  findAll(@Query() query: QueryLoanApplicationsDto) {
    return this.service.findAll(query);
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
  @ApiOperation({ summary: 'Add a guarantor to a DRAFT application' })
  async addGuarantor(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddGuarantorDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.addGuarantor(id, dto, actor.id), 'Guarantor added');
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
  @ApiOperation({ summary: 'Approve, reject, or request more information for a SUBMITTED application' })
  async review(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewLoanApplicationDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.review(id, dto, actor), 'Review recorded');
  }

  @Patch(':id/resubmit')
  @RequirePermissions('loan_applications:submit')
  @ApiOperation({ summary: 'Resubmit an application that is AWAITING_INFORMATION with the requested details' })
  async resubmit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.resubmitWithInformation(id, actor.id), 'Application resubmitted');
  }

  @Patch(':id/disburse')
  @RequirePermissions('loan_applications:disburse')
  @ApiOperation({ summary: 'Disburse an APPROVED application — creates the Loan and generates its repayment schedule automatically' })
  async disburse(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.disburse(id, actor.id), 'Loan disbursed');
  }

  @Post('loans/:loanId/repayments')
  @RequirePermissions('loan_applications:record_repayment')
  @ApiOperation({ summary: 'Record a repayment against a disbursed loan' })
  async recordRepayment(@Param('loanId', ParseUUIDPipe) loanId: string, @Body() dto: RecordRepaymentDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.recordRepayment(loanId, dto, actor.id), 'Repayment recorded');
  }
}
