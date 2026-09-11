import { Controller, Get, Param, ParseUUIDPipe, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ReceiptsService } from './receipts.service';

@ApiTags('Receipts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'receipts', version: '1' })
export class ReceiptsController {
  constructor(private readonly service: ReceiptsService) {}

  @Get(':transactionId')
  @RequirePermissions('loan_applications:read')
  @ApiOperation({ summary: 'Download the PDF receipt for a repayment transaction' })
  async download(@Param('transactionId', ParseUUIDPipe) transactionId: string, @Res({ passthrough: false }) res: Response) {
    const { buffer, filename } = await this.service.generate(transactionId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }
}
