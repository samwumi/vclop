import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { RecoveryService } from './recovery.service';
import { CreateRecoveryAccountDto } from './dto/create-recovery-account.dto';
import { UpdateRecoveryAccountDto } from './dto/update-recovery-account.dto';
import { QueryRecoveryAccountsDto } from './dto/query-recovery-accounts.dto';
import { CreateRecoveryActivityDto } from './dto/create-recovery-activity.dto';
import { CreateRecoveryPaymentDto } from './dto/create-recovery-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreateRepaymentPromiseDto } from './dto/create-repayment-promise.dto';
import { UpdatePromiseStatusDto } from './dto/update-promise-status.dto';
import { CreateRecoveryExpenseDto } from './dto/create-recovery-expense.dto';

@ApiTags('Recovery')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'recovery', version: '1' })
export class RecoveryController {
  constructor(private readonly service: RecoveryService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('dashboard')
  @RequirePermissions('recovery:dashboard_view')
  @ApiOperation({ summary: 'Get recovery dashboard metrics' })
  async getDashboard(@CurrentUser() user: RequestUser) {
    const canViewAll = user.permissions.has('recovery:accounts_all');
    const branchIds = canViewAll ? undefined : user.managedBranchIds;
    const officerId = !canViewAll && !branchIds?.length ? user.id : undefined;

    return ok(await this.service.getDashboard(branchIds, officerId));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOVERY ACCOUNTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('accounts')
  @RequirePermissions('recovery:accounts_create')
  @ApiOperation({ summary: 'Create a recovery account' })
  async createAccount(@Body() dto: CreateRecoveryAccountDto, @CurrentUser() user: RequestUser) {
    return ok(await this.service.createAccount(dto, user.id));
  }

  @Get('accounts')
  @RequirePermissions('recovery:accounts_read')
  @ApiOperation({ summary: 'List recovery accounts' })
  async listAccounts(@Query() query: QueryRecoveryAccountsDto, @CurrentUser() user: RequestUser) {
    const canViewAll = user.permissions.has('recovery:accounts_all');
    const branchIds = canViewAll ? undefined : user.managedBranchIds;

    return ok(await this.service.listAccounts(query, user.id, branchIds));
  }

  @Get('accounts/:id')
  @RequirePermissions('recovery:accounts_read')
  @ApiOperation({ summary: 'Get recovery account details' })
  async getAccount(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getAccount(id));
  }

  @Patch('accounts/:id')
  @RequirePermissions('recovery:accounts_update')
  @ApiOperation({ summary: 'Update recovery account' })
  async updateAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecoveryAccountDto,
    @CurrentUser() user: RequestUser,
  ) {
    return ok(await this.service.updateAccount(id, dto, user.id));
  }

  @Delete('accounts/:id')
  @RequirePermissions('recovery:accounts_delete')
  @ApiOperation({ summary: 'Delete recovery account' })
  async deleteAccount(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return ok(await this.service.deleteAccount(id, user.id));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOVERY ACTIVITIES
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('activities')
  @RequirePermissions('recovery:activities_create')
  @ApiOperation({ summary: 'Log a recovery activity' })
  async createActivity(@Body() dto: CreateRecoveryActivityDto, @CurrentUser() user: RequestUser) {
    return ok(await this.service.createActivity(dto, user.id));
  }

  @Get('accounts/:accountId/activities')
  @RequirePermissions('recovery:activities_read')
  @ApiOperation({ summary: 'List activities for an account' })
  async listActivities(@Param('accountId', ParseUUIDPipe) accountId: string) {
    return ok(await this.service.listActivities(accountId));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOVERY PAYMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('payments')
  @RequirePermissions('recovery:payments_record')
  @ApiOperation({ summary: 'Record a recovery payment' })
  async recordPayment(@Body() dto: CreateRecoveryPaymentDto, @CurrentUser() user: RequestUser) {
    return ok(await this.service.recordPayment(dto, user.id));
  }

  @Post('payments/:id/verify')
  @RequirePermissions('recovery:payments_verify')
  @ApiOperation({ summary: 'Verify or reject a payment' })
  async verifyPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyPaymentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return ok(await this.service.verifyPayment(id, dto, user.id));
  }

  @Get('accounts/:accountId/payments')
  @RequirePermissions('recovery:payments_read')
  @ApiOperation({ summary: 'List payments for an account' })
  async listPayments(@Param('accountId', ParseUUIDPipe) accountId: string) {
    return ok(await this.service.listPayments(accountId));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPAYMENT PROMISES
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('promises')
  @RequirePermissions('recovery:promises_create')
  @ApiOperation({ summary: 'Create a repayment promise' })
  async createPromise(@Body() dto: CreateRepaymentPromiseDto, @CurrentUser() user: RequestUser) {
    return ok(await this.service.createPromise(dto, user.id));
  }

  @Patch('promises/:id/status')
  @RequirePermissions('recovery:promises_update')
  @ApiOperation({ summary: 'Update promise status' })
  async updatePromiseStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromiseStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return ok(await this.service.updatePromiseStatus(id, dto, user.id));
  }

  @Get('accounts/:accountId/promises')
  @RequirePermissions('recovery:promises_read')
  @ApiOperation({ summary: 'List promises for an account' })
  async listPromises(@Param('accountId', ParseUUIDPipe) accountId: string) {
    return ok(await this.service.listPromises(accountId));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOVERY EXPENSES
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('expenses')
  @RequirePermissions('recovery:expenses_create')
  @ApiOperation({ summary: 'Record a recovery expense' })
  async createExpense(@Body() dto: CreateRecoveryExpenseDto, @CurrentUser() user: RequestUser) {
    return ok(await this.service.createExpense(dto, user.id));
  }

  @Get('accounts/:accountId/expenses')
  @RequirePermissions('recovery:expenses_read')
  @ApiOperation({ summary: 'List expenses for an account' })
  async listExpenses(@Param('accountId', ParseUUIDPipe) accountId: string) {
    return ok(await this.service.listExpenses(accountId));
  }
}
