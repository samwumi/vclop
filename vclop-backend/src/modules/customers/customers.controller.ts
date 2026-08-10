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
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CustomerStatus } from '@prisma/client';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto, UpdateCustomerStatusDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'customers', version: '1' })
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get()
  @RequirePermissions('customers:read')
  @ApiOperation({ summary: 'Search/list customers' })
  @ApiQuery({ name: 'status', enum: CustomerStatus, required: false })
  @ApiQuery({ name: 'branchId', required: false })
  findAll(@Query() query: QueryCustomersDto, @CurrentUser() actor: RequestUser) {
    const isAdmin = actor.permissions.has('system:admin');
    const isIC = actor.permissions.has('loan_applications:internal_control_approve');
    const isAcctHead = actor.permissions.has('loan_applications:disburse_head');

    // Compliance officers and accountants — scope to their assigned branches
    const isCompliance = actor.permissions.has('loan_applications:compliance_review');
    const isAccountant = actor.permissions.has('loan_applications:disburse') && !isAcctHead;

    if (isAdmin || isIC || isAcctHead) {
      // Admin, IC, Accounting Head — see all customers across all branches
      return this.service.findAll(query);
    }

    if (isCompliance || isAccountant) {
      // Compliance / Accountant — scope to their branches
      if (!query.branchId) {
        const branchIds = [
          ...(actor.branchId ? [actor.branchId] : []),
          ...(actor.managedBranchIds ?? []),
        ];
        const uniqueBranchIds = [...new Set(branchIds)];
        if (uniqueBranchIds.length > 0) {
          // Pass all branch IDs to service for OR query
          (query as typeof query & { branchIds?: string[] }).branchIds = uniqueBranchIds;
        }
      }
      return this.service.findAll(query);
    }

    // Loan officer / Collections — see only their own registered customers
    if (!query.assignedOfficerId) {
      query.assignedOfficerId = actor.id;
    }
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('customers:read')
  @ApiOperation({ summary: 'Customer 360 — profile, documents, dynamic form data and recent activity' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('customers:create')
  @ApiOperation({ summary: 'Register a new customer (blocked if phone/email/BVN/NIN already exists — no duplicate customers)' })
  async create(@Body() dto: CreateCustomerDto, @CurrentUser() actor: RequestUser) {
    // Default branchId to the officer's own branch if not explicitly provided
    if (!dto.branchId && actor.branchId) {
      dto.branchId = actor.branchId;
    }
    return ok(await this.service.create(dto, actor.id), 'Customer registered');
  }

  @Patch(':id')
  @RequirePermissions('customers:update')
  @ApiOperation({ summary: 'Update customer core profile fields' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.update(id, dto, actor.id), 'Customer updated');
  }

  @Patch(':id/status')
  @RequirePermissions('customers:read')
  @ApiOperation({ summary: 'Transition customer KYC/eligibility status. Loan officers can mark KYC_PENDING only. Compliance officers can mark all statuses.' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerStatusDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const isAdmin = actor.permissions.has('system:admin');
    const isCompliance =
      actor.permissions.has('loan_applications:compliance_review') ||
      actor.permissions.has('customers:manage');

    // Loan officers can only set KYC_PENDING (to flag for review)
    // Only compliance/admin can set KYC_VERIFIED, ELIGIBLE, INELIGIBLE, BLACKLISTED
    const complianceOnlyStatuses: string[] = ['KYC_VERIFIED', 'ELIGIBLE', 'INELIGIBLE', 'BLACKLISTED'];
    if (!isAdmin && !isCompliance && complianceOnlyStatuses.includes(dto.status)) {
      return ok(null, `Only a Compliance Officer can set status to ${dto.status}`);
    }

    return ok(await this.service.updateStatus(id, dto, actor.id), 'Customer status updated');
  }

  @Delete(':id')
  @RequirePermissions('customers:delete')
  @ApiOperation({ summary: 'Soft-delete a customer' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    await this.service.remove(id, actor.id);
    return ok(null, 'Customer deleted');
  }

  @Get('export/csv')
  @RequirePermissions('customers:read')
  @ApiOperation({ summary: 'Export customers list as CSV' })
  async exportCsv(
    @Query() query: QueryCustomersDto,
    @CurrentUser() actor: RequestUser,
    @Res() res: Response,
  ) {
    const isAdmin = actor.permissions.has('system:admin');
    const isIC = actor.permissions.has('loan_applications:internal_control_approve');
    const isAcctHead = actor.permissions.has('loan_applications:disburse_head');
    const isCompliance = actor.permissions.has('loan_applications:compliance_review');

    if (!isAdmin && !isIC && !isAcctHead && !isCompliance) {
      query.assignedOfficerId = actor.id;
    } else if ((isCompliance) && !isAdmin && !isIC && !isAcctHead) {
      if (!query.branchId) {
        const branchIds = [
          ...(actor.branchId ? [actor.branchId] : []),
          ...(actor.managedBranchIds ?? []),
        ];
        const uniqueIds = [...new Set(branchIds)];
        if (uniqueIds.length > 0) {
          (query as typeof query & { branchIds?: string[] }).branchIds = uniqueIds;
        }
      }
    }

    const csv = await this.service.exportCsv(query);
    const today = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="customers-${today}.csv"`,
    });
    res.send(csv);
  }
}
