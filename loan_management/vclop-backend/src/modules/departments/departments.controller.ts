import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ok } from '../../common/utils/response.util';

@ApiTags('Departments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'departments', version: '1' })
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Get()
  @RequirePermissions('departments:read')
  @ApiOperation({ summary: 'List departments' })
  findAll(@Query() query: PaginationDto & { withInactive?: boolean }) {
    return this.service.findAll(query);
  }

  @Get('tree')
  @RequirePermissions('departments:read')
  @ApiOperation({ summary: 'Get department hierarchy as tree' })
  findTree() {
    return this.service.findTree();
  }

  @Get(':id')
  @RequirePermissions('departments:read')
  @ApiOperation({ summary: 'Get department by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('departments:create')
  @ApiOperation({ summary: 'Create a department' })
  async create(@Body() dto: CreateDepartmentDto, @CurrentUser() actor: RequestUser) {
    const dept = await this.service.create(dto, actor.id);
    return ok(dept, 'Department created');
  }

  @Patch(':id')
  @RequirePermissions('departments:update')
  @ApiOperation({ summary: 'Update a department' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const dept = await this.service.update(id, dto, actor.id);
    return ok(dept, 'Department updated');
  }

  @Delete(':id')
  @RequirePermissions('departments:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a department (only if no users or sub-departments)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    await this.service.remove(id, actor.id);
    return ok(null, 'Department deleted');
  }
}
