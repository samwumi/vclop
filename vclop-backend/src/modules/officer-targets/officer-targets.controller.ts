import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { OfficerTargetsService } from './officer-targets.service';
import { SetTargetDto, QueryTargetsDto } from './dto/officer-target.dto';

@ApiTags('Officer Targets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'officer-targets', version: '1' })
export class OfficerTargetsController {
  constructor(private readonly service: OfficerTargetsService) {}

  @Get()
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'List officer targets - filtered by branch for non-admins' })
  findAll(@Query() query: QueryTargetsDto, @CurrentUser() actor: RequestUser) {
    return this.service.findAll(query, actor);
  }

  @Get(':userId/:month')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Get target for specific officer and month (YYYY-MM format)' })
  findOne(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('month') month: string,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.service.findOne(userId, month, actor);
  }

  @Post()
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Set target for an officer - Admin/Manager only' })
  async setTarget(@Body() dto: SetTargetDto, @CurrentUser() actor: RequestUser) {
    return ok(await this.service.setTarget(dto, actor.id), 'Target set successfully');
  }

  @Patch(':userId/:month')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Update target for an officer - Admin/Manager only' })
  async updateTarget(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('month') month: string,
    @Body() dto: Partial<SetTargetDto>,
    @CurrentUser() actor: RequestUser,
  ) {
    return ok(await this.service.updateTarget(userId, month, dto, actor.id), 'Target updated successfully');
  }

  @Get('dashboard/summary')
  @RequirePermissions('dashboard:read')
  @ApiOperation({ summary: 'Get target achievement summary for current month' })
  async getDashboardSummary(@CurrentUser() actor: RequestUser) {
    return this.service.getDashboardSummary(actor);
  }
}
