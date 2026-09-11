import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';

export type TransportRequestStatus =
  | 'PENDING' | 'OPERATIONS_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';

export interface TransportRequest {
  id: string;
  loanApplicationId: string;
  requestedById: string;
  purpose: string;
  location: string;
  customerCount: number;
  distanceKm: number | null;
  estimatedCost: number | null;
  suggestedAmount: number | null;
  approvedAmount: number | null;
  status: TransportRequestStatus;
  reviewedById: string | null;
  reviewedAt: string | null;
  paidById: string | null;
  paidAt: string | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  loanApplication?: {
    id: string;
    applicationNumber: string;
    customer?: { id: string; firstName: string; lastName: string; customerNumber: string } | null;
  } | null;
  requestedBy?: { id: string; firstName: string; lastName: string } | null;
  reviewedBy?: { id: string; firstName: string; lastName: string } | null;
}

export const transportService = {
  async list(status?: TransportRequestStatus): Promise<TransportRequest[]> {
    const params = status ? `?status=${status}` : '';
    const { data } = await api.get<ApiResponse<TransportRequest[]>>(`/transport-requests${params}`);
    return data.data ?? [];
  },

  async create(payload: {
    loanApplicationId: string;
    purpose: string;
    location: string;
    customerCount?: number;
    distanceKm?: number;
    estimatedCost?: number;
    suggestedAmount?: number;
  }): Promise<TransportRequest> {
    const { data } = await api.post<ApiResponse<TransportRequest>>('/transport-requests', payload);
    return data.data!;
  },

  async review(
    id: string,
    payload: { approved: boolean; approvedAmount?: number; reason?: string },
  ): Promise<TransportRequest> {
    const { data } = await api.patch<ApiResponse<TransportRequest>>(`/transport-requests/${id}/review`, payload);
    return data.data!;
  },

  async markPaid(id: string): Promise<TransportRequest> {
    const { data } = await api.patch<ApiResponse<TransportRequest>>(`/transport-requests/${id}/pay`);
    return data.data!;
  },
};
