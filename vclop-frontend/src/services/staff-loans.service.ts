import { api } from '@/lib/axios';

export interface StaffLoanEligibility {
  eligible: boolean;
  reasons: {
    activeEmployment: boolean;
    accountActive: boolean;
    noActiveLoans: boolean;
    noOverduePayments: boolean;
    hasValidSalary: boolean;
  };
  loanLimits: {
    monthlySalary: number;
    maxEligibleAmount: number;
    maxMonthlyDeduction: number;
    maxTenureMonths: number;
    minLoanAmount: number;
  };
  businessRules: {
    interestRate: string;
    maxRepaymentPeriod: string;
    maxSalaryDeduction: string;
    description: string;
  };
}

export interface StaffLoan {
  id: string;
  loanNumber: string;
  userId: string;
  principalAmount: number;
  interestRate: number;
  interestType: 'FLAT' | 'REDUCING';
  tenureMonths: number;
  totalInterest: number;
  totalRepayable: number;
  monthlyInstallment: number;
  purpose: string;
  requestedAmount: number;
  justification?: string;
  status: StaffLoanStatus;
  submittedAt?: Date;
  submittedById?: string;
  reviewedById?: string;
  reviewedAt?: Date;
  approvalNotes?: string;
  rejectionReason?: string;
  disbursedById?: string;
  disbursedAt?: Date;
  disbursementReference?: string;
  disbursementMethod?: string;
  createdAt: Date;
  createdById: string;
  updatedAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId?: string;
  };
  repaymentSchedule?: StaffLoanInstallment[];
  payments?: StaffLoanPayment[];
}

export type StaffLoanStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'ACTIVE'
  | 'FULLY_PAID'
  | 'DEFAULTED';

export interface StaffLoanInstallment {
  id: string;
  staffLoanId: string;
  installmentNumber: number;
  dueDate: Date;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  principalBalanceBefore: number;
  principalBalanceAfter: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffLoanPayment {
  id: string;
  paymentNumber: string;
  staffLoanId: string;
  installmentId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  principalPaid: number;
  interestPaid: number;
  transactionReference?: string;
  isVerified: boolean;
  verifiedById?: string;
  verifiedAt?: Date;
  isReversed: boolean;
  notes?: string;
  recordedById: string;
  recordedAt: Date;
}

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'SALARY_DEDUCTION'
  | 'MOBILE_MONEY'
  | 'CHEQUE';

export interface ApplyLoanDto {
  loanPurpose: string;
  requestedAmount: number;
  proposedTenureMonths: number;
  justification: string;
}

export interface ApproveLoanDto {
  approvedAmount: number;
  approvedTenureMonths: number;
  interestRate: number;
  approvalNotes?: string;
}

export interface RecordPaymentDto {
  loanId: string;
  installmentId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

class StaffLoansService {
  private readonly baseUrl = '/hr/staff-loans';

  /**
   * Check eligibility for staff loan
   */
  async checkEligibility(): Promise<StaffLoanEligibility> {
    const response = await api.get(`${this.baseUrl}/eligibility`);
    return response.data.data || response.data;
  }

  /**
   * Apply for staff loan
   */
  async applyForLoan(data: ApplyLoanDto): Promise<StaffLoan> {
    const response = await api.post(`${this.baseUrl}/apply`, data);
    return response.data.data || response.data;
  }

  /**
   * Get my loans
   */
  async getMyLoans(status?: StaffLoanStatus): Promise<StaffLoan[]> {
    const params = status ? { status } : {};
    const response = await api.get(`${this.baseUrl}/my-loans`, { params });
    // Backend returns { success: true, data: [...] }
    const result = response.data.data || response.data || [];
    // Ensure we always return an array
    return Array.isArray(result) ? result : [];
  }

  /**
   * Get loan by ID
   */
  async getLoanById(loanId: string): Promise<StaffLoan> {
    const response = await api.get(`${this.baseUrl}/${loanId}`);
    return response.data.data || response.data;
  }

  /**
   * Submit loan for approval (change status from DRAFT to PENDING_APPROVAL)
   */
  async submitLoan(loanId: string): Promise<StaffLoan> {
    const response = await api.post(`${this.baseUrl}/${loanId}/submit`);
    return response.data.data || response.data;
  }

  /**
   * Get all loans (Admin/HR view)
   */
  async getAllLoans(params?: {
    status?: StaffLoanStatus;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: StaffLoan[]; total: number }> {
    const response = await api.get(this.baseUrl, { params });
    const result = response.data.data || response.data;
    // Handle both paginated and non-paginated responses
    if (Array.isArray(result)) {
      return { data: result, total: result.length };
    }
    return result;
  }

  /**
   * Approve loan (Admin/HR Manager)
   */
  async approveLoan(loanId: string, data: ApproveLoanDto): Promise<StaffLoan> {
    const response = await api.post(`${this.baseUrl}/${loanId}/approve`, data);
    return response.data.data || response.data;
  }

  /**
   * Reject loan (Admin/HR Manager)
   */
  async rejectLoan(loanId: string, reason: string): Promise<StaffLoan> {
    const response = await api.post(`${this.baseUrl}/${loanId}/reject`, { reason });
    return response.data.data || response.data;
  }

  /**
   * Disburse loan (Finance)
   */
  async disburseLoan(
    loanId: string,
    data: {
      disbursementDate: Date;
      disbursementMethod: string;
      referenceNumber?: string;
      accountNumber?: string;
      bankCode?: string;
    }
  ): Promise<StaffLoan> {
    const response = await api.post(`${this.baseUrl}/${loanId}/disburse`, data);
    return response.data.data || response.data;
  }

  /**
   * Record payment
   */
  async recordPayment(data: RecordPaymentDto): Promise<StaffLoanPayment> {
    const response = await api.post(`${this.baseUrl}/payments/record`, data);
    return response.data.data || response.data;
  }

  /**
   * Get payment history for a loan
   */
  async getPaymentHistory(loanId: string): Promise<StaffLoanPayment[]> {
    const response = await api.get(`${this.baseUrl}/${loanId}/payments`);
    const result = response.data.data || response.data || [];
    return Array.isArray(result) ? result : [];
  }

  /**
   * Reverse payment (Admin only)
   */
  async reversePayment(paymentId: string, reason: string): Promise<void> {
    await api.post(`${this.baseUrl}/payments/${paymentId}/reverse`, { reason });
  }

  /**
   * Get repayment schedule
   */
  async getRepaymentSchedule(loanId: string): Promise<StaffLoanInstallment[]> {
    const response = await api.get(`${this.baseUrl}/${loanId}/schedule`);
    const result = response.data.data || response.data || [];
    return Array.isArray(result) ? result : [];
  }

  /**
   * Calculate loan preview (before applying)
   */
  async calculateLoanPreview(amount: number, tenureMonths: number): Promise<{
    monthlyInstallment: number;
    totalRepayable: number;
    totalInterest: number;
  }> {
    const response = await api.post(`${this.baseUrl}/calculate`, {
      amount,
      tenureMonths,
    });
    return response.data.data || response.data;
  }
}

export const staffLoansService = new StaffLoansService();
