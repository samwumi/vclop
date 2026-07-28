import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';

export interface LocationSummary {
  branchId: string;
  branchCode: string;
  branchName: string;
  customers: number;
  applications: number;
  activeLoans: number;
  portfolioValue: number;
  overdueInstallments: number;
  overdueValue: number;
  par: number;
  officers: number;
}

export interface OfficerPerformance {
  officerId: string;
  employeeId: string;
  name: string;
  jobTitle: string | null;
  branch: { id: string; name: string } | null;
  customers: number;
  applications: number;
  disbursements: number;
  disbursedAmount: number;
  monthlyTarget: number;
  progressPercentage: number;
}

export interface LocationDrilldown {
  branch: { id: string; code: string; name: string };
  summary: {
    totalCustomers: number;
    totalApplications: number;
    activeLoans: number;
    portfolioValue: number;
    totalRepayments: number;
    overdueInstallments: number;
    overdueValue: number;
    par: number;
    badLoans: number;
    officers: number;
  };
  customers: Array<{
    id: string;
    customerNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
    status: string;
    createdAt: string;
  }>;
  applications: Array<{
    id: string;
    applicationNumber: string;
    amount: number;
    status: string;
    createdAt: string;
    customer: { firstName: string; lastName: string; customerNumber: string } | null;
    loanProduct: { name: string } | null;
  }>;
  badLoans: Array<{
    loanNumber: string;
    principal: number;
    status: string;
    loanApplication: { customer: { firstName: string; lastName: string; customerNumber: string } } | null;
  }>;
  officers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    jobTitle: string | null;
    employeeId: string;
  }>;
  collectionCases: Array<{ status: string; _count: { _all: number } }>;
  from: string;
  to: string;
}

export const reportsService = {
  async portfolio() {
    const { data } = await api.get<ApiResponse<{ loans: number; outstanding: number; byStatus: Array<{ status: string; _count: { _all: number } }> }>>('/reports/portfolio');
    return data.data!;
  },

  async disbursements(from?: string, to?: string) {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to)   p.set('to', to);
    const { data } = await api.get<ApiResponse<{ totalCount: number; totalAmount: number }>>(`/reports/disbursements?${p}`);
    return data.data!;
  },

  async collections() {
    const { data } = await api.get<ApiResponse<{ overdue: unknown[]; cases: Array<{ status: string; _count: { _all: number } }>; totalRepayments: number }>>('/reports/collections');
    return data.data!;
  },

  async locationSummary(): Promise<LocationSummary[]> {
    const { data } = await api.get<ApiResponse<LocationSummary[]>>('/reports/location-summary');
    return data.data ?? [];
  },

  async officerPerformance(params?: { from?: string; to?: string; branchId?: string }): Promise<OfficerPerformance[]> {
    const p = new URLSearchParams();
    if (params?.from)     p.set('from', params.from);
    if (params?.to)       p.set('to', params.to);
    if (params?.branchId) p.set('branchId', params.branchId);
    const { data } = await api.get<ApiResponse<OfficerPerformance[]>>(`/reports/officer-performance?${p}`);
    return data.data ?? [];
  },

  async parByLocation(): Promise<Array<{ branchId: string; branchName: string; par: number; portfolioValue: number; overdueValue: number }>> {
    const { data } = await api.get<ApiResponse<unknown[]>>('/reports/par-by-location');
    return (data.data ?? []) as ReturnType<typeof reportsService.parByLocation> extends Promise<infer T> ? T : never;
  },

  async locationDrilldown(branchId: string, params?: { from?: string; to?: string }): Promise<LocationDrilldown | null> {
    const p = new URLSearchParams();
    if (params?.from) p.set('from', params.from);
    if (params?.to)   p.set('to', params.to);
    const { data } = await api.get<ApiResponse<LocationDrilldown>>(`/reports/location/${branchId}?${p}`);
    return data.data ?? null;
  },

  // Excel export — triggers browser download
  exportLocationSummary() {
    window.open(`/api/v1/reports/export/location-summary`, '_blank');
  },

  exportOfficerPerformance(params?: { from?: string; to?: string; branchId?: string }) {
    const p = new URLSearchParams();
    if (params?.from)     p.set('from', params.from);
    if (params?.to)       p.set('to', params.to);
    if (params?.branchId) p.set('branchId', params.branchId);
    window.open(`/api/v1/reports/export/officer-performance?${p}`, '_blank');
  },

  exportDisbursements(from?: string, to?: string) {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to)   p.set('to', to);
    window.open(`/api/v1/reports/export/disbursements?${p}`, '_blank');
  },
};
