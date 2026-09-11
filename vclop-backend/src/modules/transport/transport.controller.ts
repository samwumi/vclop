import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { TransportRequestStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; import { PermissionsGuard } from '../../common/guards/permissions.guard'; import { RequirePermissions } from '../../common/decorators/require-permissions.decorator'; import { CurrentUser } from '../../common/decorators/current-user.decorator'; import { RequestUser } from '../../common/interfaces/request-user.interface'; import { ok } from '../../common/utils/response.util'; import { TransportService } from './transport.service';
class CreateTransportDto {
  @IsString() loanApplicationId!: string;
  @IsString() purpose!: string;
  @IsString() location!: string;
  @IsOptional() @IsNumber() customerCount?: number;
  @IsOptional() @IsNumber() distanceKm?: number;
  @IsOptional() @IsNumber() estimatedCost?: number;
  @IsOptional() @IsNumber() suggestedAmount?: number;
}
class ReviewTransportDto { @IsBoolean() approved!: boolean; @IsOptional() @IsNumber() approvedAmount?: number; @IsOptional() @IsString() reason?: string; }
@ApiTags('Transport') @ApiBearerAuth('JWT-auth') @UseGuards(JwtAuthGuard, PermissionsGuard) @Controller({ path: 'transport-requests', version: '1' })
export class TransportController {
  constructor(private readonly service: TransportService) {}
  @Get()
  @RequirePermissions('loan_applications:read')
  list(
    @Query('status') status?: TransportRequestStatus,
    @Query('location') location?: string,
    @CurrentUser() user?: RequestUser,
  ) {
    // Compliance officers are scoped to their own location (branch name)
    const canViewAll =
      user?.permissions.has('system:admin') ||
      user?.permissions.has('transport:approve') ||
      user?.permissions.has('loan_applications:disburse_head');
    const locationFilter = (!canViewAll && user?.branchId) ? location : location;
    return this.service.list(status, locationFilter, canViewAll ? undefined : user?.branchId ?? undefined);
  }
  @Post()   @RequirePermissions('loan_applications:compliance_review')         async create(@Body() dto: CreateTransportDto, @CurrentUser() user: RequestUser) { return ok(await this.service.create(dto, user.id)); }
  @Patch(':id/review') @RequirePermissions('transport:approve')                async review(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewTransportDto, @CurrentUser() user: RequestUser) { return ok(await this.service.review(id, dto.approved, dto.approvedAmount, dto.reason, user.id)); }
  @Patch(':id/pay')    @RequirePermissions('loan_applications:disburse_head')  async pay(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) { return ok(await this.service.markPaid(id, user.id)); }
}
