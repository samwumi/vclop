import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';

export interface OfficerTarget {
  id: string;
  userId: string;
  targetMonth: string;
  disbursementTarget: number;
  customerTarget: number;
  disbursementAchieved: number;
  customerAchieved: number;
  disbursementAchievementRate: number;
  customerAchievementRate: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    branchId: string;
    branch: {
      id: string;
      name: string;
      code: string;
    };
  };
}

export interface SetTargetDto {
  userId: string;
  targetMonth: string; // YYYY-MM format
  disbursementTarget: number;
  customerTarget: number;
  notes?: string;
}

export const officerTargetsService = {
  async list(params?: { userId?: string; month?: string; branchId?: string }): Promise<OfficerTarget[]> {
    const p = new URLSearchParams();
    if (params?.userId) p.set('userId', params.userId);
    if (params?.month) p.set('month', params.month);
    if (params?.branchId) p.set('branchId', params.branchId);
    const { data } = await api.get<ApiResponse<OfficerTarget[]>>(`/officer-targets?${p}`);
    return data.data ?? [];
  },

  async getOne(userId: string, month: string): Promise<OfficerTarget | null> {
    const { data } = await api.get<ApiResponse<OfficerTarget>>(`/officer-targets/${userId}/${month}`);
    return data.data ?? null;
  },

  async setTarget(dto: SetTargetDto): Promise<OfficerTarget> {
    const { data } = await api.post<ApiResponse<OfficerTarget>>('/officer-targets', dto);
    return data.data!;
  },

  async updateTarget(userId: string, month: string, updates: Partial<SetTargetDto>): Promise<OfficerTarget> {
    const { data } = await api.patch<ApiResponse<OfficerTarget>>(`/officer-targets/${userId}/${month}`, updates);
    return data.data!;
  },

  async getDashboardSummary(): Promise<any> {
    const { data } = await api.get<ApiResponse<any>>('/officer-targets/dashboard/summary');
    return data.data;
  },
};
