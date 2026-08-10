import { Injectable } from '@nestjs/common';
import { AuditAction, LoanApplicationStatus, Prisma, WorkflowAction, WorkflowTaskStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ForbiddenActionException, ResourceNotFoundException } from '../../common/exceptions/app.exceptions';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateWorkflowDefinitionDto, TransitionWorkflowDto } from './dto/workflow.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService, private readonly events: EventEmitter2, private readonly notifications: NotificationsService) {}

  async createDefinition(dto: CreateWorkflowDefinitionDto, actorId: string) {
    if (dto.stages.filter((stage) => stage.isInitial).length !== 1) throw new BusinessException('A workflow must have exactly one initial stage');
    const stageCodes = new Set(dto.stages.map((stage) => stage.code));
    if (stageCodes.size !== dto.stages.length) throw new BusinessException('Workflow stage codes must be unique');
    for (const transition of dto.transitions) {
      if (!stageCodes.has(transition.fromStageCode) || !stageCodes.has(transition.toStageCode)) throw new BusinessException('Each transition must reference a configured stage');
    }
    const definition = await this.prisma.workflowDefinition.create({
      data: {
        code: dto.code, name: dto.name, entityType: dto.entityType,
        stages: { create: dto.stages.map((stage) => ({ ...stage, allowedActions: stage.allowedActions ? JSON.stringify(stage.allowedActions) : undefined })) },
      }, include: { stages: true },
    });
    await this.prisma.workflowTransition.createMany({ data: dto.transitions.map((transition) => ({
      fromStageId: (definition.stages as Array<{ id: string; code: string }>).find((s) => s.code === transition.fromStageCode)!.id,
      toStageId: (definition.stages as Array<{ id: string; code: string }>).find((s) => s.code === transition.toStageCode)!.id,
      action: transition.action, requiresReason: transition.requiresReason ?? false,
      conditions: transition.conditions ? JSON.stringify(transition.conditions) : undefined,
    })) });
    this.audit(AuditAction.CREATE, actorId, definition.id, `Created workflow ${definition.code}`);
    return this.getDefinition(definition.id);
  }

  async getDefinition(id: string) {
    const definition = await this.prisma.workflowDefinition.findUnique({ where: { id }, include: { stages: { orderBy: { sortOrder: 'asc' }, include: { fromTransitions: { include: { toStage: true } } } } } });
    if (!definition) throw new ResourceNotFoundException('Workflow definition', id);
    return definition;
  }

  async start(definitionCode: string, entityType: string, entityId: string, actorId: string) {
    const definition = await this.prisma.workflowDefinition.findFirst({ where: { code: definitionCode, entityType, isActive: true }, include: { stages: true } });
    if (!definition) throw new BusinessException(`No active ${entityType} workflow is configured`);
    const initial = definition.stages.find((stage) => stage.isInitial);
    if (!initial) throw new BusinessException(`Workflow ${definitionCode} has no initial stage`);
    const dueAt = initial.slaHours ? new Date(Date.now() + initial.slaHours * 3_600_000) : undefined;
    const assignedToId = await this.findAssignee(initial.requiredPermission, initial.departmentCode);
    const instance = await this.prisma.workflowInstance.create({ data: {
      workflowDefinitionId: definition.id, entityType, entityId, currentStageCode: initial.code, startedById: actorId,
      tasks: { create: { stageId: initial.id, assignedToId, assignedAt: assignedToId ? new Date() : undefined, dueAt } },
    }, include: { tasks: { include: { stage: true } } } });
    await this.notifications.notifyPermission(initial.requiredPermission, 'workflow.task.created', `New ${initial.name} task`, `A ${entityType.replace(/_/g, ' ').toLowerCase()} requires your action.`);
    this.audit(AuditAction.SUBMIT, actorId, entityId, `Started ${definition.code} workflow`);
    return instance;
  }

  async getInstance(entityType: string, entityId: string) {
    return this.prisma.workflowInstance.findFirst({ where: { entityType, entityId }, include: { workflowDefinition: true, tasks: { include: { stage: true }, orderBy: { createdAt: 'asc' } } } });
  }

  async getMyTasks(userId: string) {
    return this.prisma.workflowTask.findMany({ where: { assignedToId: userId, status: { in: [WorkflowTaskStatus.PENDING, WorkflowTaskStatus.IN_PROGRESS, WorkflowTaskStatus.OVERDUE] } }, include: { stage: true, workflowInstance: true }, orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }] });
  }

  async claimTask(taskId: string, actor: RequestUser) {
    const task = await this.prisma.workflowTask.findUnique({ where: { id: taskId }, include: { stage: true } });
    if (!task) throw new ResourceNotFoundException('Workflow task', taskId);
    this.assertStagePermission(task.stage.requiredPermission, actor);
    if (task.status !== WorkflowTaskStatus.PENDING || (task.assignedToId && task.assignedToId !== actor.id)) throw new BusinessException('This task cannot be claimed');
    return this.prisma.workflowTask.update({ where: { id: taskId }, data: { assignedToId: actor.id, assignedAt: new Date(), status: WorkflowTaskStatus.IN_PROGRESS } });
  }

  async transition(entityType: string, entityId: string, dto: TransitionWorkflowDto, actor: RequestUser) {
    const instance = await this.prisma.workflowInstance.findFirst({ where: { entityType, entityId }, include: { workflowDefinition: { include: { stages: true } }, tasks: { where: { status: { in: [WorkflowTaskStatus.PENDING, WorkflowTaskStatus.IN_PROGRESS, WorkflowTaskStatus.OVERDUE] } }, include: { stage: true } } } });
    if (!instance) throw new ResourceNotFoundException('Workflow instance', entityId);
    const currentStage = instance.workflowDefinition.stages.find((stage) => stage.code === instance.currentStageCode);
    if (!currentStage) throw new BusinessException('Workflow instance has an invalid current stage');
    this.assertStagePermission(currentStage.requiredPermission, actor);
    const activeTask = instance.tasks[0];
    if (!activeTask) throw new BusinessException('There is no active task for this workflow stage');
    // Any user with the required permission can action a task — do not block
    // based on the auto-assigned userId (first available user at submission time
    // may differ from who actually opens the case).
    const transition = await this.prisma.workflowTransition.findFirst({ where: { fromStageId: currentStage.id, action: dto.action }, include: { toStage: true } });
    if (!transition) throw new BusinessException(`${dto.action} is not allowed from ${currentStage.name}`);
    if (transition.requiresReason && !dto.reason?.trim()) throw new BusinessException('A reason is required for this action');
    const dueAt = transition.toStage.slaHours ? new Date(Date.now() + transition.toStage.slaHours * 3_600_000) : undefined;
    const assignedToId = dto.assignToId ?? await this.findAssignee(transition.toStage.requiredPermission, transition.toStage.departmentCode);
    await this.prisma.$transaction(async (tx) => {
      await tx.workflowTask.updateMany({ where: { id: { in: instance.tasks.map((task) => task.id) } }, data: { status: WorkflowTaskStatus.COMPLETED, completedById: actor.id, completedAt: new Date(), action: dto.action, reason: dto.reason, notes: dto.notes } });
      await tx.workflowInstance.update({ where: { id: instance.id }, data: { currentStageCode: transition.toStage.code, status: transition.toStage.isTerminal ? WorkflowTaskStatus.COMPLETED : WorkflowTaskStatus.PENDING, completedAt: transition.toStage.isTerminal ? new Date() : undefined } });
      if (!transition.toStage.isTerminal) await tx.workflowTask.create({ data: { workflowInstanceId: instance.id, stageId: transition.toStage.id, assignedToId, assignedAt: assignedToId ? new Date() : undefined, dueAt } });
    });
    // Loan applications keep their denormalized status for existing APIs and reporting.
    if (entityType === 'LOAN_APPLICATION' && Object.values(LoanApplicationStatus).includes(transition.toStage.code as LoanApplicationStatus)) {
      await this.prisma.loanApplication.update({ where: { id: entityId }, data: { status: transition.toStage.code as LoanApplicationStatus } });
    }
    this.audit(dto.action === WorkflowAction.APPROVE ? AuditAction.APPROVE : dto.action === WorkflowAction.REJECT ? AuditAction.REJECT : AuditAction.UPDATE, actor.id, entityId, `${dto.action} at ${currentStage.code}`);
    if (!transition.toStage.isTerminal) await this.notifications.notifyPermission(transition.toStage.requiredPermission, 'workflow.task.created', `New ${transition.toStage.name} task`, `A ${entityType.replace(/_/g, ' ').toLowerCase()} is ready for your action.`);
    return this.getInstance(entityType, entityId);
  }

  private assertStagePermission(requiredPermission: string | null, actor: RequestUser) {
    if (!requiredPermission || actor.permissions.has('system:admin') || actor.permissions.has(requiredPermission)) return;
    throw new ForbiddenActionException(`Missing permission required for this workflow stage: ${requiredPermission}`);
  }

  private async findAssignee(permission: string | null, departmentCode?: string | null): Promise<string | undefined> {
    if (!permission) return undefined;
    const permissionFilter = {
      OR: [
        {
          userRoles: {
            some: {
              role: {
                rolePermissions: {
                  some: {
                    permission: { code: permission, isActive: true },
                  },
                },
              },
            },
          },
        },
        {
          userPermissions: {
            some: {
              granted: true,
              permission: { code: permission, isActive: true },
            },
          },
        },
      ],
    };
    const user = await this.prisma.user.findFirst({ where: { deletedAt: null, status: 'ACTIVE', ...(departmentCode ? { department: { code: departmentCode } } : {}), ...permissionFilter }, orderBy: { createdAt: 'asc' }, select: { id: true } })
      ?? await this.prisma.user.findFirst({ where: { deletedAt: null, status: 'ACTIVE', ...permissionFilter }, orderBy: { createdAt: 'asc' }, select: { id: true } });
    return user?.id;
  }

  private audit(action: AuditAction, userId: string, entityId: string, description: string) {
    this.events.emit('audit.log', { userId, action, module: 'workflows', entityId, entityType: 'WorkflowInstance', description, isSuccess: true });
  }
}
