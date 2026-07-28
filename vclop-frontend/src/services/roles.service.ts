import { api } from '@/lib/axios';
import type { ApiResponse, PaginationParams } from '@/types/api.types';
import type { Role } from '@/types/domain.types';

export const rolesService = {
  async list(params?: PaginationParams) {
    const p = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p.set(k, String(v)); });
    const { data } = await api.get<ApiResponse<{ data: Role[] }>>(`/roles?${p}`);
    return data.data!;
  },
  async get(id: string) {
    const { data } = await api.get<ApiResponse<Role>>(`/roles/${id}`);
    return data.data!;
  },
  async create(payload: unknown) {
    const { data } = await api.post<ApiResponse<Role>>('/roles', payload);
    return data.data!;
  },
  async update(id: string, payload: unknown) {
    const { data } = await api.patch<ApiResponse<Role>>(`/roles/${id}`, payload);
    return data.data!;
  },
  async remove(id: string) {
    await api.delete(`/roles/${id}`);
  },
  async syncPermissions(id: string, permissionIds: string[]) {
    await api.post(`/roles/${id}/permissions/sync`, { permissionIds });
  },
};
