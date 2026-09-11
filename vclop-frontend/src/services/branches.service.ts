import { api } from '@/lib/axios';
import type { ApiResponse, PaginationParams } from '@/types/api.types';
import type { Branch } from '@/types/domain.types';

export const branchesService = {
  async list(params?: PaginationParams) {
    const p = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p.set(k, String(v)); });
    const { data } = await api.get<ApiResponse<{ data: Branch[] }>>(`/branches?${p}`);
    return data.data!;
  },
  async get(id: string) {
    const { data } = await api.get<ApiResponse<Branch>>(`/branches/${id}`);
    return data.data!;
  },
  async create(payload: unknown) {
    const { data } = await api.post<ApiResponse<Branch>>('/branches', payload);
    return data.data!;
  },
  async update(id: string, payload: unknown) {
    const { data } = await api.patch<ApiResponse<Branch>>(`/branches/${id}`, payload);
    return data.data!;
  },
  async remove(id: string) {
    await api.delete(`/branches/${id}`);
  },
};
