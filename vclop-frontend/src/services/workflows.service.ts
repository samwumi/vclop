import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';

export type WorkflowAction = 'APPROVE' | 'REJECT' | 'RETURN' | 'REQUEST_INFORMATION' | 'ESCALATE' | 'COMPLETE';

export interface WorkflowStageInput {
  code: string;
  name: string;
  sortOrder: number;
  requiredPermission?: string;
  departmentCode?: string;
  slaHours?: number;
  isInitial?: boolean;
  isTerminal?: boolean;
  allowedActions?: WorkflowAction[];
}

export interface WorkflowTransitionInput {
  fromStageCode: string;
  toStageCode: string;
  action: WorkflowAction;
  requiresReason?: boolean;
}

export interface WorkflowDefinitionInput {
  code: string;
  name: string;
  entityType: string;
  stages: WorkflowStageInput[];
  transitions: WorkflowTransitionInput[];
}

export interface WorkflowTask {
  id: string;
  status: string;
  dueAt: string | null;
  createdAt: string;
  stage: { code: string; name: string };
  workflowInstance: { entityType: string; entityId: string; currentStageCode: string };
}

export const workflowsService = {
  async createDefinition(payload: WorkflowDefinitionInput) {
    const { data } = await api.post<ApiResponse<{ id: string }>>('/workflows/definitions', payload);
    return data.data!;
  },

  async getDefinition(id: string) {
    const { data } = await api.get<ApiResponse<unknown>>(`/workflows/definitions/${id}`);
    return data.data!;
  },

  async myTasks(): Promise<WorkflowTask[]> {
    const { data } = await api.get<ApiResponse<WorkflowTask[]>>('/workflows/tasks/mine');
    return data.data ?? [];
  },

  async claimTask(id: string) {
    const { data } = await api.patch<ApiResponse<WorkflowTask>>(`/workflows/tasks/${id}/claim`);
    return data.data!;
  },

  async getInstance(entityType: string, entityId: string) {
    const { data } = await api.get<ApiResponse<unknown>>(`/workflows/${entityType}/${entityId}`);
    return data.data!;
  },

  async transition(entityType: string, entityId: string, payload: { action: WorkflowAction; reason?: string; notes?: string; assignToId?: string }) {
    const { data } = await api.post<ApiResponse<unknown>>(`/workflows/${entityType}/${entityId}/transition`, payload);
    return data.data!;
  },
};
