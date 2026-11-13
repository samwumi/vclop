import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { TransactionsService } from './transactions.service';
import { TransactionQueryDto } from './dto/transaction-query.dto';

@ApiTags('Transactions')
@Controller({ path: 'transactions', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Get daily transactions (VA + Manual repayments)' })
  @RequirePermissions('loan_applications:record_repayment')
  async getDailyTransactions(@Query() query: TransactionQueryDto) {
    return this.transactionsService.getDailyTransactions(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get transaction statistics for a specific date' })
  @RequirePermissions('reports:read')
  async getTransactionStats(@Query('date') date?: string) {
    return this.transactionsService.getTransactionStats(date);
  }
}
