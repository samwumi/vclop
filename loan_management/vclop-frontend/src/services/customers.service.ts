import { api } from '@/lib/axios';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api.types';
import type { Customer, Customer360, CustomerDocument, CustomerStatus } from '@/types/domain.types';

export const customersService = {
  async list(params?: PaginationParams & { status?: CustomerStatus; branchId?: string; search?: string }): Promise<PaginatedResponse<Customer>> {
    const p = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p.set(k, String(v)); });
    const { data } = await api.get<ApiResponse<Customer[]>>(`/customers?${p}`);
    return { data: data.data ?? [], meta: data.meta! };
  },

  /** Client-side "search" reuses the same list endpoint's `search` param — there's no separate /search route on the backend. */
  async search(q: string, limit = 10): Promise<Customer[]> {
    if (!q) return [];
    const result = await this.list({ search: q, limit, page: 1 });
    return result.data;
  },

  /** Full Customer 360 — profile + documents + dynamic form data + activity timeline, all in one call. */
  async get(id: string): Promise<Customer360> {
    const { data } = await api.get<ApiResponse<Customer360>>(`/customers/${id}`);
    return data.data!;
  },

  async create(payload: Record<string, unknown>): Promise<Customer> {
    const { data } = await api.post<ApiResponse<Customer>>('/customers', payload);
    return data.data!;
  },

  async update(id: string, payload: Record<string, unknown>): Promise<Customer> {
    const { data } = await api.patch<ApiResponse<Customer>>(`/customers/${id}`, payload);
    return data.data!;
  },

  /** One generic status transition endpoint covers KYC progression and blacklist/unblacklist — there's no separate route per action. */
  async updateStatus(id: string, status: CustomerStatus, reason?: string): Promise<Customer> {
    const { data } = await api.patch<ApiResponse<Customer>>(`/customers/${id}/status`, { status, reason });
    return data.data!;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  // ── Documents ────────────────────────────────────────────────────────────

  async getDocuments(customerId: string): Promise<CustomerDocument[]> {
    const { data } = await api.get<ApiResponse<CustomerDocument[]>>(`/customers/${customerId}/documents`);
    return data.data ?? [];
  },

  async uploadDocument(customerId: string, documentTypeId: string, file: File): Promise<CustomerDocument> {
    const form = new FormData();
    form.append('file', file);
    form.append('documentTypeId', documentTypeId);
    const { data } = await api.post<ApiResponse<CustomerDocument>>(`/customers/${customerId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data!;
  },

  async verifyDocument(
    customerId: string,
    documentId: string,
    status: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string,
  ): Promise<CustomerDocument> {
    const { data } = await api.patch<ApiResponse<CustomerDocument>>(
      `/customers/${customerId}/documents/${documentId}/verify`,
      { status, rejectionReason },
    );
    return data.data!;
  },

  async deleteDocument(customerId: string, documentId: string): Promise<void> {
    await api.delete(`/customers/${customerId}/documents/${documentId}`);
  },
};

export const documentTypesService = {
  async list(params?: { appliesTo?: 'INDIVIDUAL' | 'BUSINESS'; withInactive?: boolean }) {
    const p = new URLSearchParams();
    if (params?.appliesTo) p.set('appliesTo', params.appliesTo);
    if (params?.withInactive) p.set('withInactive', 'true');
    const { data } = await api.get<ApiResponse<unknown[]>>(`/document-types?${p}`);
    return data.data ?? [];
  },
};
