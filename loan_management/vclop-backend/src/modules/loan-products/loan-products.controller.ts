import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { LoanProductsService } from './loan-products.service';
import { CreateLoanProductDto, UpdateLoanProductDto } from './dto/loan-product.dto';
import { QueryLoanProductsDto } from './dto/query-loan-products.dto';

@ApiTags('Loan Products')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'loan-products', version: '1' })
export class LoanProductsController {
  constructor(private readonly service: LoanProductsService) {}

  @Get()
  @RequirePermissions('loan_products:read')
  @ApiOperation({ summary: 'List/search loan products' })
  @ApiQuery({ name: 'isActive', required: false })
  findAll(@Query() query: QueryLoanProductsDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('loan_products:read')
  @ApiOperation({ summary: 'Get a loan product' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('loan_products:create')
  @ApiOperation({ summary: 'Create a loan product — no code change needed to launch it' })
  async create(@Body() dto: CreateLoanProductDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.create(dto, actor.id), 'Loan product created');
  }

  @Patch(':id')
  @RequirePermissions('loan_products:update')
  @ApiOperation({ summary: 'Update a loan product' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLoanProductDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.update(id, dto, actor.id), 'Loan product updated');
  }

  @Delete(':id')
  @RequirePermissions('loan_products:delete')
  @ApiOperation({ summary: 'Delete a loan product (blocked once applications reference it — deactivate instead)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    await this.service.remove(id, actor.id);
    return ok(null, 'Loan product deleted');
  }
}
