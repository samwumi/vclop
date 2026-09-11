import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ok } from '../../common/utils/response.util';

@ApiTags('Branches')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'branches', version: '1' })
export class BranchesController {
  constructor(private readonly service: BranchesService) {}

  /**
   * Lightweight list of active location branches (excludes Head Office).
   * Used by customer registration and user creation forms.
   * Requires only basic auth — no special permission needed.
   */
  @Get('locations')
  @ApiOperation({ summary: 'List active location branches (for dropdowns — no special permission required)' })
  async locations() {
    const result = await this.service.listLocations();
    return ok(result, 'Locations');
  }

  @Get()
  @RequirePermissions('branches:read')
  @ApiOperation({ summary: 'List branches' })
  findAll(@Query() query: PaginationDto & { withInactive?: boolean }) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('branches:read')
  @ApiOperation({ summary: 'Get branch by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('branches:create')
  @ApiOperation({ summary: 'Create a branch' })
  async create(@Body() dto: CreateBranchDto, @CurrentUser() actor: RequestUser) {
    const branch = await this.service.create(dto, actor.id);
    return ok(branch, 'Branch created');
  }

  @Patch(':id')
  @RequirePermissions('branches:update')
  @ApiOperation({ summary: 'Update a branch' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const branch = await this.service.update(id, dto, actor.id);
    return ok(branch, 'Branch updated');
  }

  @Delete(':id')
  @RequirePermissions('branches:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a branch' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    await this.service.remove(id, actor.id);
    return ok(null, 'Branch deleted');
  }
}
