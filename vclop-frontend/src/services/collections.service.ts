import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { InstallmentStatus, LoanStatus } from '@/types/domain.types';

export type CollectionCaseStatus =
  | 'OPEN' | 'PROMISE_TO_PAY' | 'BROKEN_PROMISE' | 'LEGAL' | 'RESOLVED' | 'WRITTEN_OFF';

export interface CollectionActivity {
  id: string;
  collectionCaseId: string;
  performedById: string;
  activityType: string;
  note: string;
  nextActionAt: string | null;
  occurredAt: string;
}

export interface CollectionCase {
  id: string;
  loanId: string;
  assignedToId: string | null;
  status: CollectionCaseStatus;
  nextActionAt: string | null;
  promiseAmount: number | null;
  promiseDate: string | null;
  writeOffReason: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  loan?: {
    id: string;
    loanNumber: string;
    status: LoanStatus;
    principal: number;
    totalRepayable: number;
    loanApplicationId: string;
    installments: Array<{
      id: string;
      installmentNumber: number;
      dueDate: string;
      totalDue: number;
      amountPaid: number;
      status: InstallmentStatus;
    }>;
    loanApplication?: {
      id: string;
      applicationNumber: string;
      customer?: { id: string; firstName: string; lastName: string; customerNumber: string; phone: string } | null;
    } | null;
  } | null;
  activities?: CollectionActivity[];
}

export const collectionsService = {
  async list(status?: CollectionCaseStatus): Promise<CollectionCase[]> {
    const params = status ? `?status=${status}` : '';
    const { data } = await api.get<ApiResponse<CollectionCase[]>>(`/collections${params}`);
    return data.data ?? [];
  },

  async open(loanId: string): Promise<CollectionCase> {
    const { data } = await api.post<ApiResponse<CollectionCase>>('/collections', { loanId });
    return data.data!;
  },

  async update(
    id: string,
    payload: {
      status?: CollectionCaseStatus;
      nextActionAt?: string;
      promiseAmount?: number;
      promiseDate?: string;
      writeOffReason?: string;
    },
  ): Promise<CollectionCase> {
    const { data } = await api.patch<ApiResponse<CollectionCase>>(`/collections/${id}`, payload);
    return data.data!;
  },

  async addActivity(
    id: string,
    payload: { activityType: string; note: string; nextActionAt?: string },
  ): Promise<CollectionActivity> {
    const { data } = await api.post<ApiResponse<CollectionActivity>>(`/collections/${id}/activities`, payload);
    return data.data!;
  },
};
