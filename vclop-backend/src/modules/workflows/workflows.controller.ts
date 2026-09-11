import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';
import { CreateWorkflowDefinitionDto, TransitionWorkflowDto } from './dto/workflow.dto';
import { WorkflowsService } from './workflows.service';

@ApiTags('Workflows') @ApiBearerAuth('JWT-auth') @UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'workflows', version: '1' })
export class WorkflowsController {
  constructor(private readonly service: WorkflowsService) {}
  @Post('definitions') @RequirePermissions('settings:update') @ApiOperation({ summary: 'Create a database-configured workflow definition' })
  async create(@Body() dto: CreateWorkflowDefinitionDto, @CurrentUser() user: RequestUser) { return ok(await this.service.createDefinition(dto, user.id), 'Workflow created'); }
  @Get('definitions/:id') @RequirePermissions('settings:read')
  getDefinition(@Param('id', ParseUUIDPipe) id: string) { return this.service.getDefinition(id); }
  @Get('tasks/mine') @RequirePermissions('dashboard:read')
  myTasks(@CurrentUser() user: RequestUser) { return this.service.getMyTasks(user.id); }
  @Patch('tasks/:id/claim') @RequirePermissions('dashboard:read')
  claim(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) { return this.service.claimTask(id, user); }
  @Get(':entityType/:entityId') @RequirePermissions('loan_applications:read')
  instance(@Param('entityType') entityType: string, @Param('entityId', ParseUUIDPipe) entityId: string) { return this.service.getInstance(entityType, entityId); }
  @Post(':entityType/:entityId/transition')
  @ApiOperation({ summary: 'Transition a workflow; authorization is enforced from the active stage configuration' })
  async transition(@Param('entityType') entityType: string, @Param('entityId', ParseUUIDPipe) entityId: string, @Body() dto: TransitionWorkflowDto, @CurrentUser() user: RequestUser) { return ok(await this.service.transition(entityType, entityId, dto, user), 'Workflow transitioned'); }
}
