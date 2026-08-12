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

  /** Manually sync PENDING virtual account from Paystack when webhook delivery failed */
  async syncFromPaystack(virtualAccountId: string): Promise<VirtualAccount> {
    const { data } = await api.post<ApiResponse<VirtualAccount>>(`/virtual-accounts/${virtualAccountId}/sync-from-paystack`);
    return data.data!;
  },
};
