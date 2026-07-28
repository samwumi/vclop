import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CollectionCaseStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; import { PermissionsGuard } from '../../common/guards/permissions.guard'; import { RequirePermissions } from '../../common/decorators/require-permissions.decorator'; import { CurrentUser } from '../../common/decorators/current-user.decorator'; import { RequestUser } from '../../common/interfaces/request-user.interface'; import { ok } from '../../common/utils/response.util'; import { CollectionsService } from './collections.service';
class OpenCaseDto { @IsString() loanId!: string; @IsOptional() @IsString() assignedToId?: string; }
class UpdateCaseDto { @IsOptional() @IsEnum(CollectionCaseStatus) status?: CollectionCaseStatus; @IsOptional() @IsString() assignedToId?: string; @IsOptional() @IsDateString() nextActionAt?: string; @IsOptional() @IsNumber() promiseAmount?: number; @IsOptional() @IsDateString() promiseDate?: string; @IsOptional() @IsString() writeOffReason?: string; }
class ActivityDto { @IsString() activityType!: string; @IsString() note!: string; @IsOptional() @IsDateString() nextActionAt?: string; }
@ApiTags('Collections') @ApiBearerAuth('JWT-auth') @UseGuards(JwtAuthGuard, PermissionsGuard) @Controller({ path: 'collections', version: '1' })
export class CollectionsController {
  constructor(private readonly service: CollectionsService) {}

  @Get()
  @RequirePermissions('loan_applications:read')
  list(@Query('status') status?: CollectionCaseStatus, @CurrentUser() user?: RequestUser) {
    // Scope: loan officers see only their own customers' cases
    // Compliance/IC see cases for their managed branches
    // Admin / head roles see all
    const isAdmin = user?.permissions.has('system:admin');
    const canViewAll = isAdmin ||
      user?.permissions.has('loan_applications:internal_control_approve') ||
      user?.permissions.has('loan_applications:disburse_head');

    const officerBranchIds = canViewAll ? undefined :
      (user?.managedBranchIds?.length ? user.managedBranchIds :
        (user?.branchId ? [user.branchId] : undefined));

    const assignedOfficerId = (!canViewAll && !user?.permissions.has('loan_applications:compliance_review'))
      ? user?.id
      : undefined;

    return this.service.list(status, officerBranchIds, assignedOfficerId);
  }

  @Post()                   @RequirePermissions('loan_applications:record_repayment') async open(@Body() dto: OpenCaseDto, @CurrentUser() user: RequestUser) { return ok(await this.service.open(dto.loanId, user.id, dto.assignedToId)); }
  @Patch(':id')             @RequirePermissions('loan_applications:record_repayment') async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCaseDto, @CurrentUser() user: RequestUser) { return ok(await this.service.update(id, { ...dto, nextActionAt: dto.nextActionAt ? new Date(dto.nextActionAt) : undefined, promiseDate: dto.promiseDate ? new Date(dto.promiseDate) : undefined }, user.id)); }
  @Post(':id/activities')   @RequirePermissions('loan_applications:record_repayment') async activity(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActivityDto, @CurrentUser() user: RequestUser) { return ok(await this.service.addActivity(id, { ...dto, nextActionAt: dto.nextActionAt ? new Date(dto.nextActionAt) : undefined }, user.id)); }
}
