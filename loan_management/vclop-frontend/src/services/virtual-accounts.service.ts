import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { VirtualAccount, VirtualAccountTransaction } from '@/types/domain.types';

export const virtualAccountsService = {
  async list(customerId?: string): Promise<VirtualAccount[]> {
    const p = new URLSearchParams();
    if (customerId) p.set('customerId', customerId);
    const { data } = await api.get<ApiResponse<VirtualAccount[]>>(`/virtual-accounts?${p}`);
    return data.data ?? [];
  },

  async getByLoanId(loanId: string): Promise<VirtualAccount> {
    const { data } = await api.get<ApiResponse<VirtualAccount>>(`/virtual-accounts/loan/${loanId}`);
    return data.data!;
  },

  async getUnmatched(): Promise<VirtualAccountTransaction[]> {
    const { data } = await api.get<ApiResponse<VirtualAccountTransaction[]>>('/virtual-accounts/unmatched');
    return data.data ?? [];
  },

  async resolveUnmatched(transactionId: string, virtualAccountId: string): Promise<VirtualAccountTransaction> {
    const { data } = await api.patch<ApiResponse<VirtualAccountTransaction>>(`/virtual-accounts/unmatched/${transactionId}/resolve`, { virtualAccountId });
    return data.data!;
  },

  /** Dev/testing only — only works while the LOCAL provider is active on the backend. */
  async simulatePayment(virtualAccountId: string, payload: { amount: number; payerName?: string; narration?: string }): Promise<VirtualAccountTransaction> {
    const { data } = await api.post<ApiResponse<VirtualAccountTransaction>>(`/virtual-accounts/${virtualAccountId}/simulate-payment`, payload);
    return data.data!;
  },
};
