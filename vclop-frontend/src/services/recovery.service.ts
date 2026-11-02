import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type RecoverySource = 'LEGACY' | 'VCLOP';

export type RecoveryStatus =
  | 'PENDING_VERIFICATION'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PROMISE_ACTIVE'
  | 'LEGAL_ACTION'
  | 'PARTIALLY_RECOVERED'
  | 'FULLY_RECOVERED'
  | 'WRITTEN_OFF'
  | 'CLOSED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ActivityType =
  | 'PHONE_CALL'
  | 'SMS_SENT'
  | 'EMAIL_SENT'
  | 'FIELD_VISIT'
  | 'OFFICE_VISIT'
  | 'NEGOTIATION'
  | 'PROMISE_RECEIVED'
  | 'LEGAL_NOTICE'
  | 'PAYMENT_RECEIVED'
  | 'OTHER';

export type ContactMethod = 'PHONE' | 'SMS' | 'EMAIL' | 'IN_PERSON' | 'WHATSAPP';

export type ContactOutcome =
  | 'CONTACTED'
  | 'NO_ANSWER'
  | 'WRONG_NUMBER'
  | 'PROMISED_PAYMENT'
  | 'REFUSED_TO_PAY'
  | 'PARTIAL_AGREEMENT'
  | 'HOSTILE'
  | 'NOT_FOUND'
  | 'PENDING_CALLBACK';

export type PaymentStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

export type PromiseStatus = 'ACTIVE' | 'KEPT' | 'PARTIAL' | 'BROKEN' | 'CANCELLED';

export type ExpenseType =
  | 'FUEL'
  | 'LEGAL_FEES'
  | 'COURT_FEES'
  | 'INVESTIGATION'
  | 'COMMUNICATION'
  | 'TRAVEL'
  | 'OTHER';

export interface RecoveryAccount {
  id: string;
  accountNumber: string;
  source: RecoverySource;
  vclopLoanId: string | null;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: string | null;
  originalPrincipal: number;
  disbursementDate: string;
  originalReference: string | null;
  historicalRepayments: number;
  outstandingBalance: number;
  recoveredAmount: number;
  totalExpenses: number;
  netRecovery: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  assignedOfficerId: string | null;
  assignedDate: string | null;
  branchId: string | null;
  status: RecoveryStatus;
  priorityLevel: PriorityLevel;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    customerNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
  } | null;
  assignedOfficer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  branch?: {
    id: string;
    name: string;
  } | null;
  activities?: RecoveryActivity[];
  payments?: RecoveryPayment[];
  promises?: RepaymentPromise[];
  expenses?: RecoveryExpense[];
}

export interface RecoveryActivity {
  id: string;
  accountId: string;
  activityType: ActivityType;
  activityDate: string;
  contactMethod: ContactMethod | null;
  contactOutcome: ContactOutcome | null;
  notes: string | null;
  nextFollowupDate: string | null;
  latitude: number | null;
  longitude: number | null;
  visitAddress: string | null;
  recordedById: string;
  createdAt: string;
  recordedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface RecoveryPayment {
  id: string;
  accountId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string | null;
  status: PaymentStatus;
  recordedById: string;
  verifiedById: string | null;
  verifiedAt: string | null;
  verificationNotes: string | null;
  rejectionReason: string | null;
  receiptPath: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  recordedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  verifiedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface RepaymentPromise {
  id: string;
  accountId: string;
  promisedAmount: number;
  promisedDate: string;
  promiseNotes: string | null;
  status: PromiseStatus;
  actualPaidAmount: number | null;
  actualPaidDate: string | null;
  recordedById: string;
  createdAt: string;
  updatedAt: string;
  recordedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface RecoveryExpense {
  id: string;
  accountId: string;
  expenseType: ExpenseType;
  amount: number;
  expenseDate: string;
  description: string | null;
  receiptPath: string | null;
  recordedById: string;
  createdAt: string;
  recordedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface RecoveryDashboard {
  summary: {
    totalAccounts: number;
    totalOutstanding: number;
    totalRecovered: number;
    totalExpenses: number;
    netRecovery: number;
    recoveryRate: number;
  };
  accountsByStatus: Array<{
    status: RecoveryStatus;
    count: number;
  }>;
  accountsBySource: Array<{
    source: RecoverySource;
    count: number;
  }>;
  recentPayments: Array<
    RecoveryPayment & {
      account: {
        accountNumber: string;
        customerName: string;
      };
    }
  >;
  activePromises: number;
  upcomingFollowups: Array<
    RecoveryActivity & {
      account: {
        accountNumber: string;
        customerName: string;
        customerPhone: string;
      };
    }
  >;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export const recoveryService = {
  // Dashboard
  async getDashboard(): Promise<RecoveryDashboard> {
    const { data } = await api.get<ApiResponse<RecoveryDashboard>>('/recovery/dashboard');
    return data.data!;
  },

  // Accounts
  async listAccounts(params?: {
    source?: RecoverySource;
    status?: RecoveryStatus;
    priorityLevel?: PriorityLevel;
    assignedOfficerId?: string;
    branchId?: string;
    search?: string;
  }): Promise<RecoveryAccount[]> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const { data } = await api.get<ApiResponse<RecoveryAccount[]>>(`/recovery/accounts${queryString}`);
    return data.data ?? [];
  },

  async getAccount(id: string): Promise<RecoveryAccount> {
    const { data } = await api.get<ApiResponse<RecoveryAccount>>(`/recovery/accounts/${id}`);
    return data.data!;
  },

  async createAccount(payload: {
    source: RecoverySource;
    vclopLoanId?: string;
    customerId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddress?: string;
    originalPrincipal: number;
    disbursementDate: string;
    originalReference?: string;
    historicalRepayments: number;
    outstandingBalance: number;
    assignedOfficerId?: string;
    branchId?: string;
    priorityLevel?: PriorityLevel;
    notes?: string;
  }): Promise<RecoveryAccount> {
    const { data } = await api.post<ApiResponse<RecoveryAccount>>('/recovery/accounts', payload);
    return data.data!;
  },

  async updateAccount(
    id: string,
    payload: {
      assignedOfficerId?: string;
      branchId?: string;
      status?: RecoveryStatus;
      priorityLevel?: PriorityLevel;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      customerAddress?: string;
      outstandingBalance?: number;
      notes?: string;
    },
  ): Promise<RecoveryAccount> {
    const { data } = await api.patch<ApiResponse<RecoveryAccount>>(`/recovery/accounts/${id}`, payload);
    return data.data!;
  },

  async deleteAccount(id: string): Promise<void> {
    await api.delete(`/recovery/accounts/${id}`);
  },

  // Activities
  async createActivity(payload: {
    accountId: string;
    activityType: ActivityType;
    activityDate?: string;
    contactMethod?: ContactMethod;
    contactOutcome?: ContactOutcome;
    notes?: string;
    nextFollowupDate?: string;
    latitude?: number;
    longitude?: number;
    visitAddress?: string;
  }): Promise<RecoveryActivity> {
    const { data } = await api.post<ApiResponse<RecoveryActivity>>('/recovery/activities', payload);
    return data.data!;
  },

  async listActivities(accountId: string): Promise<RecoveryActivity[]> {
    const { data } = await api.get<ApiResponse<RecoveryActivity[]>>(`/recovery/accounts/${accountId}/activities`);
    return data.data ?? [];
  },

  // Payments
  async recordPayment(payload: {
    accountId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }): Promise<RecoveryPayment> {
    const { data } = await api.post<ApiResponse<RecoveryPayment>>('/recovery/payments', payload);
    return data.data!;
  },

  async verifyPayment(
    paymentId: string,
    payload: {
      approved: boolean;
      notes?: string;
    },
  ): Promise<RecoveryPayment> {
    const { data } = await api.post<ApiResponse<RecoveryPayment>>(
      `/recovery/payments/${paymentId}/verify`,
      payload,
    );
    return data.data!;
  },

  async listPayments(accountId: string): Promise<RecoveryPayment[]> {
    const { data } = await api.get<ApiResponse<RecoveryPayment[]>>(`/recovery/accounts/${accountId}/payments`);
    return data.data ?? [];
  },

  // Promises
  async createPromise(payload: {
    accountId: string;
    promisedAmount: number;
    promisedDate: string;
    promiseNotes?: string;
  }): Promise<RepaymentPromise> {
    const { data } = await api.post<ApiResponse<RepaymentPromise>>('/recovery/promises', payload);
    return data.data!;
  },

  async updatePromiseStatus(
    promiseId: string,
    payload: {
      status: PromiseStatus;
      actualPaidAmount?: number;
      actualPaidDate?: string;
    },
  ): Promise<RepaymentPromise> {
    const { data } = await api.patch<ApiResponse<RepaymentPromise>>(
      `/recovery/promises/${promiseId}/status`,
      payload,
    );
    return data.data!;
  },

  async listPromises(accountId: string): Promise<RepaymentPromise[]> {
    const { data } = await api.get<ApiResponse<RepaymentPromise[]>>(`/recovery/accounts/${accountId}/promises`);
    return data.data ?? [];
  },

  // Expenses
  async createExpense(payload: {
    accountId: string;
    expenseType: ExpenseType;
    amount: number;
    expenseDate: string;
    description?: string;
  }): Promise<RecoveryExpense> {
    const { data } = await api.post<ApiResponse<RecoveryExpense>>('/recovery/expenses', payload);
    return data.data!;
  },

  async listExpenses(accountId: string): Promise<RecoveryExpense[]> {
    const { data } = await api.get<ApiResponse<RecoveryExpense[]>>(`/recovery/accounts/${accountId}/expenses`);
    return data.data ?? [];
  },
};
