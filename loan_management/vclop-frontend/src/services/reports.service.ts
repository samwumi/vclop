import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';

export const reportsService = {
  async portfolio() { const { data } = await api.get<ApiResponse<{ loans: number; outstanding: number; byStatus: Array<{ status: string; _count: { _all: number } }> }>>('/reports/portfolio'); return data.data!; },
  async disbursements() { const { data } = await api.get<ApiResponse<{ totalCount: number; totalAmount: number }>>('/reports/disbursements'); return data.data!; },
  async collections() { const { data } = await api.get<ApiResponse<{ overdue: unknown[]; cases: Array<{ status: string; _count: { _all: number } }>; totalRepayments: number }>>('/reports/collections'); return data.data!; },
};
