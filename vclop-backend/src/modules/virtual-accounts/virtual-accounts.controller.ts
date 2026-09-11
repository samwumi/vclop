import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VirtualAccountProviderType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ok } from '../../common/utils/response.util';
import { VirtualAccountsService } from './virtual-accounts.service';
import { SimulatePaymentDto } from './dto/simulate-payment.dto';

@ApiTags('Virtual Accounts')
@Controller({ path: 'virtual-accounts', version: '1' })
export class VirtualAccountsController {
  constructor(private readonly service: VirtualAccountsService) {}

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('virtual_accounts:read')
  @ApiOperation({ summary: 'List virtual accounts' })
  findAll(@Query('customerId') customerId?: string) {
    return this.service.findAll(customerId);
  }

  @Get('unmatched')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('virtual_accounts:reconcile')
  @ApiOperation({ summary: 'Payments that could not be matched to any account — the reconciliation queue' })
  findUnmatched() {
    return this.service.findUnmatched();
  }

  @Get('loan/:loanId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('virtual_accounts:read')
  @ApiOperation({ summary: "Get a loan's virtual account and its transaction history" })
  findByLoan(@Param('loanId', ParseUUIDPipe) loanId: string) {
    return this.service.findByLoanId(loanId);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('virtual_accounts:read')
  @ApiOperation({ summary: 'Get a virtual account' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('unmatched/:transactionId/resolve')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('virtual_accounts:reconcile')
  @ApiOperation({ summary: 'Manually link an unmatched payment to the correct virtual account (Accounting resolution action)' })
  async resolveUnmatched(
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Body('virtualAccountId') virtualAccountId: string,
  ) {
    return ok(await this.service.resolveUnmatched(transactionId, virtualAccountId), 'Payment reconciled');
  }

  @Post(':id/simulate-payment')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('virtual_accounts:simulate')
  @ApiOperation({ summary: 'Dev/testing only — simulates an incoming payment through the exact same reconciliation path a real webhook would use. Only works on the LOCAL provider.' })
  async simulatePayment(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SimulatePaymentDto) {
    return ok(await this.service.simulatePayment(id, dto), 'Payment simulated and reconciled');
  }

  /**
   * Manually trigger virtual account creation for a loan that didn't get one automatically.
   * Useful when the auto-creation failed (e.g. Paystack error on disbursement).
   */
  @Post('create-for-loan/:loanId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('virtual_accounts:read')
  @ApiOperation({ summary: 'Manually create a virtual account for a disbursed loan (by loan ID or loan application ID)' })
  async createForLoan(@Param('loanId', ParseUUIDPipe) loanId: string) {
    return ok(await this.service.createForLoanApplication(loanId), 'Virtual account created');
  }

  /**
   * Manually sync a PENDING virtual account with Paystack to fetch the actual account number.
   * Use when webhook delivery failed but account was assigned on Paystack side.
   */
  @Post(':id/sync-from-paystack')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('virtual_accounts:read')
  @ApiOperation({ summary: 'Manually fetch account number from Paystack for a PENDING virtual account' })
  async syncFromPaystack(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.syncFromPaystack(id), 'Virtual account synced from Paystack');
  }

  /**
   * Manually fetch recent transactions from Paystack and reconcile them.
   * Use when webhooks fail but payments were received on Paystack.
   */
  @Post(':id/fetch-paystack-transactions')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('virtual_accounts:read')
  @ApiOperation({ summary: 'Manually fetch and reconcile recent transactions from Paystack' })
  async fetchPaystackTransactions(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.fetchPaystackTransactions(id), 'Transactions fetched and reconciled');
  }

  /**
   * Real bank webhook endpoint — intentionally has no JWT guard, since the
   * bank's servers can't authenticate with our app's JWTs. Protected instead
   * by the provider's own signature verification inside the service.
   */
  @Post('webhooks/:provider')
  @Public()
  @ApiOperation({ summary: 'Webhook receiver for the given provider — verifies signature, then reconciles the payment' })
  async webhook(
    @Param('provider') provider: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
  ) {
    const providerType = provider.toUpperCase() as VirtualAccountProviderType;
    // req.rawBody is populated by NestFactory's rawBody:true option (see main.ts) — this is
    // the exact byte sequence the provider signed, required for HMAC signature verification
    // to actually work. The JSON.stringify fallback only applies if that's ever misconfigured.
    const rawBody = req.rawBody ?? JSON.stringify(req.body);
    return ok(await this.service.handleWebhook(providerType, rawBody, headers), 'Webhook processed');
  }
}
