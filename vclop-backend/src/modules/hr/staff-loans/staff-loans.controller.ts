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
import { StaffLoansService } from './staff-loans.service';
import { PaymentService } from './payment.service';
import { RepaymentService } from './repayment.service';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { RejectLoanDto } from './dto/reject-loan.dto';
import { DisburseLoanDto } from './dto/disburse-loan.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { StaffLoanStatus } from '@prisma/client';

@ApiTags('HR - Staff Loans')
@ApiBearerAuth()
@Controller('hr/staff-loans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StaffLoansController {
  constructor(
    private readonly staffLoansService: StaffLoansService,
    private readonly paymentService: PaymentService,
    private readonly repaymentService: RepaymentService,
  ) {}

  /**
   * Apply for staff loan
   */
  @Post('apply')
  @RequirePermissions('staff_loans:create')
  @ApiOperation({ summary: 'Apply for a staff loan' })
  @ApiResponse({ status: 201, description: 'Application submitted successfully' })
  @ApiResponse({ status: 400, description: 'Ineligible or invalid request' })
  async applyForLoan(@Body() dto: ApplyLoanDto, @Request() req: any) {
    const userId = req.user.userId;

    const loan = await this.staffLoansService.applyForLoan({
      ...dto,
      userId,
    });

    return {
      success: true,
      message: 'Loan application submitted',
      data: loan,
    };
  }

  /**
   * Check loan eligibility
   */
  @Get('eligibility')
  @RequirePermissions('staff_loans:read')
  @ApiOperation({ summary: 'Check loan eligibility' })
  @ApiResponse({ status: 200, description: 'Eligibility retrieved' })
  async checkEligibility(@Request() req: any) {
    const userId = req.user.userId;

    const eligibility = await this.staffLoansService.checkEligibility(userId);

    return {
      success: true,
      data: eligibility,
    };
  }

  /**
   * Get my staff loans
   */
  @Get('my-loans')
  @RequirePermissions('staff_loans:read')
  @ApiOperation({ summary: 'Get my staff loans' })
  @ApiResponse({ status: 200, description: 'Loans retrieved successfully' })
  async getMyLoans(@Query('status') status: StaffLoanStatus, @Request() req: any) {
    const userId = req.user.userId;

    const loans = await this.staffLoansService.getMyLoans(userId, status);

    return {
      success: true,
      data: loans,
    };
  }

  /**
   * Get loan details
   */
  @Get(':id')
  @RequirePermissions('staff_loans:read')
  @ApiOperation({ summary: 'Get loan details with repayment schedule' })
  @ApiResponse({ status: 200, description: 'Loan details retrieved' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  async getLoanDetails(@Param('id') id: string) {
    const loan = await this.staffLoansService.getLoanDetails(id);

    return {
      success: true,
      data: loan,
    };
  }

  /**
   * Get pending loan approvals
   */
  @Get('pending/approvals')
  @RequirePermissions('staff_loans:approve')
  @ApiOperation({ summary: 'Get pending loan approvals' })
  @ApiResponse({ status: 200, description: 'Pending approvals retrieved' })
  async getPendingApprovals() {
    const loans = await this.staffLoansService.getPendingApprovals();

    return {
      success: true,
      data: loans,
    };
  }

  /**
   * Approve loan
   */
  @Post(':id/approve')
  @RequirePermissions('staff_loans:approve')
  @ApiOperation({ summary: 'Approve staff loan application' })
  @ApiResponse({ status: 200, description: 'Loan approved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or not pending' })
  async approveLoan(
    @Param('id') id: string,
    @Body() dto: ApproveLoanDto,
    @Request() req: any,
  ) {
    const approverId = req.user.userId;

    const loan = await this.staffLoansService.approveLoan(id, approverId, dto);

    return {
      success: true,
      message: 'Loan approved',
      data: loan,
    };
  }

  /**
   * Reject loan
   */
  @Post(':id/reject')
  @RequirePermissions('staff_loans:approve')
  @ApiOperation({ summary: 'Reject staff loan application' })
  @ApiResponse({ status: 200, description: 'Loan rejected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or not pending' })
  async rejectLoan(
    @Param('id') id: string,
    @Body() dto: RejectLoanDto,
    @Request() req: any,
  ) {
    const rejectorId = req.user.userId;

    const loan = await this.staffLoansService.rejectLoan(id, rejectorId, dto.reason);

    return {
      success: true,
      message: 'Loan rejected',
      data: loan,
    };
  }

  /**
   * Disburse loan
   */
  @Post(':id/disburse')
  @RequirePermissions('staff_loans:disburse')
  @ApiOperation({ summary: 'Disburse approved staff loan' })
  @ApiResponse({ status: 200, description: 'Loan disbursed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or not approved' })
  async disburseLoan(
    @Param('id') id: string,
    @Body() dto: DisburseLoanDto,
    @Request() req: any,
  ) {
    const disburserId = req.user.userId;

    const loan = await this.staffLoansService.disburseLoan(id, disburserId, dto);

    return {
      success: true,
      message: 'Loan disbursed and repayment schedule generated',
      data: loan,
    };
  }

  /**
   * Record payment
   */
  @Post(':loanId/installments/:installmentId/payment')
  @RequirePermissions('staff_loan_payments:record')
  @ApiOperation({ summary: 'Record loan payment' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async recordPayment(
    @Param('loanId') loanId: string,
    @Param('installmentId') installmentId: string,
    @Body() dto: RecordPaymentDto,
    @Request() req: any,
  ) {
    const recordedById = req.user.userId;

    const result = await this.paymentService.recordPayment({
      loanId,
      installmentId,
      ...dto,
      recordedById,
    });

    return {
      success: true,
      message: 'Payment recorded',
      data: result,
    };
  }

  /**
   * Reverse payment
   */
  @Post('payments/:paymentId/reverse')
  @RequirePermissions('staff_loan_payments:reverse')
  @ApiOperation({ summary: 'Reverse a loan payment' })
  @ApiResponse({ status: 200, description: 'Payment reversed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or already reversed' })
  async reversePayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: { reason: string },
    @Request() req: any,
  ) {
    const reversedById = req.user.userId;

    const reversal = await this.paymentService.reversePayment(
      paymentId,
      reversedById,
      dto.reason,
    );

    return {
      success: true,
      message: 'Payment reversed',
      data: reversal,
    };
  }

  /**
   * Get payment history
   */
  @Get(':id/payments')
  @RequirePermissions('staff_loans:read')
  @ApiOperation({ summary: 'Get payment history for a loan' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved' })
  async getPaymentHistory(@Param('id') id: string) {
    const payments = await this.paymentService.getPaymentHistory(id);

    return {
      success: true,
      data: payments,
    };
  }

  /**
   * Get next installment due
   */
  @Get(':id/next-installment')
  @RequirePermissions('staff_loans:read')
  @ApiOperation({ summary: 'Get next installment due' })
  @ApiResponse({ status: 200, description: 'Next installment retrieved' })
  async getNextInstallment(@Param('id') id: string) {
    const installment = await this.repaymentService.getNextInstallment(id);

    return {
      success: true,
      data: installment,
    };
  }
}
