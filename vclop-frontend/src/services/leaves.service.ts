import { api } from '@/lib/axios';

export type LeaveStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export type DayType = 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';

export type ApprovalDecision = 'APPROVED' | 'REJECTED';

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  defaultDaysPerYear: number;
  maxDaysPerRequest: number | null;
  minDaysNotice: number;
  requiresDocumentation: boolean;
  countWeekendsAsLeave: boolean;
  countHolidaysAsLeave: boolean;
  canCarryForward: boolean;
  maxCarryForwardDays: number | null;
  isPaid: boolean;
  isActive: boolean;
  requiresApproval: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveApplication {
  id: string;
  applicationNumber: string;
  userId: string;
  leaveTypeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  startDayType: DayType;
  endDayType: DayType;
  businessDays: number;
  reason: string;
  status: LeaveStatus;
  primaryEntitlementYear: number;
  secondaryEntitlementYear: number | null;
  daysFromPrimary: number;
  daysFromSecondary: number | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  attachmentPath: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvals?: LeaveApproval[];
}

export interface LeaveApproval {
  id: string;
  leaveApplicationId: string;
  approverId: string;
  approver: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  level: number;
  decision: ApprovalDecision | null;
  decidedAt: Date | null;
  comments: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveBalance {
  entitledDays: number;
  carriedForward: number;
  totalAvailable: number;
  used: number;
  pending: number;
  remaining: number;
}

export interface LeaveBalanceWithType extends LeaveBalance {
  leaveType: LeaveType;
}

export interface CreateLeaveApplicationDto {
  leaveTypeId: string;
  startDate: string | Date;
  endDate: string | Date;
  startDayType?: DayType;
  endDayType?: DayType;
  reason: string;
  attachmentPath?: string;
}

export interface CancelLeaveApplicationDto {
  reason: string;
}

export interface ApproveLeaveDto {
  decision: ApprovalDecision;
  comments?: string;
}

class LeavesService {
  private baseUrl = '/hr/leaves';

  /**
   * Create a new leave application (DRAFT)
   */
  async createApplication(data: CreateLeaveApplicationDto): Promise<LeaveApplication> {
    const response = await api.post(`${this.baseUrl}/apply`, data);
    return response.data.data || response.data;
  }

  /**
   * Submit leave application for approval
   */
  async submitApplication(applicationId: string): Promise<{
    application: LeaveApplication;
    approvals: LeaveApproval[] | null;
    autoApproved: boolean;
  }> {
    const response = await api.post(`${this.baseUrl}/${applicationId}/submit`);
    return response.data.data || response.data;
  }

  /**
   * Cancel leave application
   */
  async cancelApplication(
    applicationId: string,
    data: CancelLeaveApplicationDto
  ): Promise<LeaveApplication> {
    const response = await api.post(`${this.baseUrl}/${applicationId}/cancel`, data);
    return response.data.data || response.data;
  }

  /**
   * Get my leave applications
   */
  async getMyApplications(status?: LeaveStatus): Promise<LeaveApplication[]> {
    const params = status ? { status } : {};
    const response = await api.get(`${this.baseUrl}/my-applications`, { params });
    const result = response.data.data || response.data || [];
    return Array.isArray(result) ? result : [];
  }

  /**
   * Get specific leave application details
   */
  async getApplicationById(applicationId: string): Promise<LeaveApplication> {
    const response = await api.get(`${this.baseUrl}/${applicationId}`);
    return response.data.data || response.data;
  }

  /**
   * Get my leave balance for a specific year
   */
  async getMyBalance(year: number, leaveTypeId?: string): Promise<LeaveBalanceWithType | LeaveBalanceWithType[]> {
    const url = leaveTypeId 
      ? `${this.baseUrl}/my-balance/${year}/${leaveTypeId}`
      : `${this.baseUrl}/my-balance/${year}`;
    const response = await api.get(url);
    return response.data.data || response.data;
  }

  /**
   * Get all leave types
   */
  async getLeaveTypes(): Promise<LeaveType[]> {
    const response = await api.get('/hr/leave-types');
    const result = response.data.data || response.data || [];
    return Array.isArray(result) ? result : [];
  }

  /**
   * Get pending approvals assigned to me
   */
  async getPendingApprovals(): Promise<LeaveApproval[]> {
    const response = await api.get(`${this.baseUrl}/pending-approvals`);
    const result = response.data.data || response.data || [];
    return Array.isArray(result) ? result : [];
  }

  /**
   * Process approval decision
   */
  async processApproval(
    approvalId: string,
    data: ApproveLeaveDto
  ): Promise<{ message: string; application: LeaveApplication }> {
    const response = await api.post(`${this.baseUrl}/approvals/${approvalId}/decide`, data);
    return response.data.data || response.data;
  }

  /**
   * Get approval history for an application
   */
  async getApprovalHistory(applicationId: string): Promise<LeaveApproval[]> {
    const response = await api.get(`${this.baseUrl}/${applicationId}/approval-history`);
    const result = response.data.data || response.data || [];
    return Array.isArray(result) ? result : [];
  }

  /**
   * Get all leave applications (Admin/HR view)
   */
  async getAllApplications(params?: {
    status?: LeaveStatus;
    userId?: string;
    leaveTypeId?: string;
    year?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: LeaveApplication[]; total: number }> {
    const response = await api.get(this.baseUrl, { params });
    const result = response.data.data || response.data;
    if (Array.isArray(result)) {
      return { data: result, total: result.length };
    }
    return result;
  }
}

export const leavesService = new LeavesService();
