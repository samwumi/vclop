import { apiClient } from '@/lib/api-client';

export type TransactionType = 'ALL' | 'VIRTUAL_ACCOUNT' | 'MANUAL';
export type TransactionStatus = 'ALL' | 'MATCHED' | 'UNMATCHED' | 'PENDING';

export interface TransactionQueryParams {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  search?: string;
}

export interface Transaction {
  id: string;
  type: 'VIRTUAL_ACCOUNT' | 'MANUAL';
  amount: number;
  date: string;
  status: 'MATCHED' | 'UNMATCHED' | 'PENDING';
  reference: string;
  payerName: string | null;
  accountNumber: string;
  provider?: string;
  method?: string;
  notes?: string;
  customer: {
    id: string;
    customerNumber: string;
    name: string;
    phone: string;
  } | null;
  loan: {
    id: string;
    loanNumber: string;
  } | null;
}

export interface TransactionSummary {
  totalAmount: number;
  totalCount: number;
  vaCount: number;
  vaAmount: number;
  manualCount: number;
  manualAmount: number;
  matchedCount: number;
  unmatchedCount: number;
}

export interface DailyTransactionsResponse {
  transactions: Transaction[];
  summary: TransactionSummary;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface TransactionStats {
  date: string;
  vaTransactions: {
    count: number;
    amount: number;
  };
  manualTransactions: {
    count: number;
    amount: number;
  };
  total: {
    count: number;
    amount: number;
  };
}

export const transactionsService = {
  async getDailyTransactions(params?: TransactionQueryParams): Promise<DailyTransactionsResponse> {
    const response = await apiClient.get('/transactions/daily', { params });
    return response.data;
  },

  async getStats(date?: string): Promise<TransactionStats> {
    const response = await apiClient.get('/transactions/stats', {
      params: date ? { date } : undefined,
    });
    return response.data;
  },
};
