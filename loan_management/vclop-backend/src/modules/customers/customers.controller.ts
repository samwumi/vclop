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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CustomerStatus } from '@prisma/client';
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
  findAll(@Query() query: QueryCustomersDto) {
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
  @RequirePermissions('customers:update')
  @ApiOperation({ summary: 'Transition a customer through the KYC/eligibility lifecycle' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerStatusDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.updateStatus(id, dto, actor.id), 'Customer status updated');
  }

  @Delete(':id')
  @RequirePermissions('customers:delete')
  @ApiOperation({ summary: 'Soft-delete a customer' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    await this.service.remove(id, actor.id);
    return ok(null, 'Customer deleted');
  }
}
