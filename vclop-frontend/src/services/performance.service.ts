import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';

export interface PerformanceSummary {
  monthlyTarget: number;
  currentAchievement: number;
  remainingTarget: number;
  progressPercentage: number;
  monthlyApplications: number;
  monthlyDisbursements: number;
  weeklyDisbursedAmount: number;
  weeklyAllowance: number;
  allowancePerMillion: number;
  approvalPercentage: number;
}

export const performanceService = {
  async mine(): Promise<PerformanceSummary> {
    const { data } = await api.get<ApiResponse<PerformanceSummary>>('/performance/me');
    return data.data!;
  },
};
