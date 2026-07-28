import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { DashboardLayout, Widget } from '@/types/domain.types';

export interface DashboardBootstrap {
  widgets: Widget[];
  layout: DashboardLayout | null;
  availableWidgets: Widget[];
}

export interface StatCardData {
  total: number;
  active?: number;
  locked?: number;
  pending?: number;
}

export interface OperationalSummary {
  role: 'SUPER_ADMIN' | 'LOAN_OFFICER' | 'UNDERWRITER_COMPLIANCE' | 'INTERNAL_CONTROL' | 'ACCOUNTING' | 'COLLECTIONS';
  myTasks: number;
  applications: number;
  complianceQueue: number;
  icQueue: number;
  approvedLoans: number;
  collectionCases: number;
  transportRequests: number;
  overdueInstallments: number;
}

export interface LoginActivityPoint {
  date: string;
  logins: number;
  failures: number;
}

export interface UserStatusPoint {
  status: string;
  _count: { status: number };
}

export const dashboardService = {
  async bootstrap(): Promise<DashboardBootstrap> {
    const { data } = await api.get<ApiResponse<DashboardBootstrap>>('/dashboard');
    return data.data!;
  },

  async operationalSummary(): Promise<OperationalSummary> {
    const { data } = await api.get<ApiResponse<OperationalSummary>>('/dashboard/operational-summary');
    return data.data!;
  },

  async activeUsers(): Promise<StatCardData> {
    const { data } = await api.get<ApiResponse<StatCardData>>('/dashboard/stats/active-users');
    return data.data!;
  },

  async totalBranches(): Promise<StatCardData> {
    const { data } = await api.get<ApiResponse<StatCardData>>('/dashboard/stats/total-branches');
    return data.data!;
  },

  async totalDepartments(): Promise<StatCardData> {
    const { data } = await api.get<ApiResponse<StatCardData>>('/dashboard/stats/total-departments');
    return data.data!;
  },

  async userStatusChart(): Promise<UserStatusPoint[]> {
    const { data } = await api.get<ApiResponse<UserStatusPoint[]>>('/dashboard/stats/user-status');
    return data.data!;
  },

  async loginActivity(days = 7): Promise<LoginActivityPoint[]> {
    const { data } = await api.get<ApiResponse<LoginActivityPoint[]>>(
      `/dashboard/stats/login-activity?days=${days}`,
    );
    return data.data!;
  },

  async recentAudit(limit = 8): Promise<unknown[]> {
    const { data } = await api.get<ApiResponse<unknown[]>>(
      `/dashboard/widgets/recent-audit?limit=${limit}`,
    );
    return data.data!;
  },

  async systemHealth(): Promise<unknown> {
    const { data } = await api.get<ApiResponse<unknown>>('/dashboard/stats/health');
    return data.data!;
  },
};
