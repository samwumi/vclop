import { api } from '@/lib/axios';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api.types';
import type { Loan, LoanApplication, LoanApplicationStatus } from '@/types/domain.types';

export const loansService = {
  async list(params?: PaginationParams & { status?: LoanApplicationStatus; customerId?: string; loanProductId?: string }): Promise<PaginatedResponse<LoanApplication>> {
    const p = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) p.set(k, String(v)); });
    const { data } = await api.get<ApiResponse<LoanApplication[]>>(`/loan-applications?${p}`);
    // Backend's TransformInterceptor lifts pagination meta to the top level — data.data is the flat array.
    return { data: data.data ?? [], meta: data.meta! };
  },

  async get(id: string): Promise<LoanApplication> {
    const { data } = await api.get<ApiResponse<LoanApplication>>(`/loan-applications/${id}`);
    return data.data!;
  },

  async create(payload: { customerId: string; loanProductId: string; amount: number; tenureDays: number; purpose?: string }): Promise<LoanApplication> {
    const { data } = await api.post<ApiResponse<LoanApplication>>('/loan-applications', payload);
    return data.data!;
  },

  async addGuarantor(applicationId: string, payload: { firstName: string; lastName: string; phone: string; relationship?: string }): Promise<LoanApplication> {
    const { data } = await api.post<ApiResponse<LoanApplication>>(`/loan-applications/${applicationId}/guarantors`, payload);
    return data.data!;
  },

  async addCollateral(applicationId: string, payload: { description: string; estimatedValue?: number }): Promise<LoanApplication> {
    const { data } = await api.post<ApiResponse<LoanApplication>>(`/loan-applications/${applicationId}/collaterals`, payload);
    return data.data!;
  },

  async submit(applicationId: string): Promise<LoanApplication> {
    const { data } = await api.patch<ApiResponse<LoanApplication>>(`/loan-applications/${applicationId}/submit`, {});
    return data.data!;
  },

  async review(applicationId: string, decision: 'APPROVED' | 'REJECTED', reviewNotes?: string, rejectionReason?: string): Promise<LoanApplication> {
    const { data } = await api.patch<ApiResponse<LoanApplication>>(`/loan-applications/${applicationId}/review`, { decision, reviewNotes, rejectionReason });
    return data.data!;
  },

  async disburse(applicationId: string): Promise<LoanApplication> {
    const { data } = await api.patch<ApiResponse<LoanApplication>>(`/loan-applications/${applicationId}/disburse`, {});
    return data.data!;
  },

  async recordRepayment(loanId: string, payload: { amount: number; method?: string; reference?: string; notes?: string }): Promise<Loan> {
    const { data } = await api.post<ApiResponse<Loan>>(`/loan-applications/loans/${loanId}/repayments`, payload);
    return data.data!;
  },
};
