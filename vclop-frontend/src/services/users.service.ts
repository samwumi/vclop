import { api } from '@/lib/axios';
import type { ApiResponse, PaginationParams } from '@/types/api.types';
import type { User } from '@/types/domain.types';

export const usersService = {
  async list(params: PaginationParams & { status?: string; branchId?: string; departmentId?: string }) {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p.set(k, String(v)); });
    const { data } = await api.get<ApiResponse<{ data: User[] }>>(`/users?${p}`);
    return data.data!;
  },

  async get(id: string) {
    const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
    return data.data!;
  },

  async create(payload: unknown) {
    const { data } = await api.post<ApiResponse<User>>('/users', payload);
    return data.data!;
  },

  async update(id: string, payload: unknown) {
    const { data } = await api.patch<ApiResponse<User>>(`/users/${id}`, payload);
    return data.data!;
  },

  async remove(id: string) {
    await api.delete(`/users/${id}`);
  },

  async lock(id: string, reason?: string) {
    await api.post(`/users/${id}/lock`, { reason });
  },

  async unlock(id: string) {
    await api.post(`/users/${id}/unlock`);
  },

  async resetPassword(id: string, newPassword: string) {
    await api.post(`/users/${id}/reset-password`, { newPassword });
  },

  async assignRoles(id: string, roleIds: string[]) {
    await api.post(`/users/${id}/roles`, { roleIds });
  },

  async revokeRoles(id: string, roleIds: string[]) {
    await api.delete(`/users/${id}/roles`, { data: { roleIds } });
  },

  // Location-based permissions
  async getLocationPermissions(id: string) {
    const { data } = await api.get<ApiResponse<{
      id: string;
      branchId: string;
      branchName: string;
      branchCode: string;
      canViewLoans: boolean;
      grantedById?: string;
      grantedByName?: string;
      grantedAt: string;
      revokedAt?: string;
    }[]>>(`/users/${id}/location-permissions`);
    return data.data!;
  },

  async grantLocationPermission(id: string, branchIds: string[]) {
    await api.post(`/users/${id}/location-permissions`, { branchIds });
  },

  async revokeLocationPermission(id: string, branchId: string) {
    await api.delete(`/users/${id}/location-permissions/${branchId}`);
  },
};
