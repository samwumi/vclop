import { api } from '@/lib/axios';

export type OffboardingStatus =
  | 'INITIATED'
  | 'IT_ACCESS_REVOKED'
  | 'FINANCE_CLEARED'
  | 'ASSETS_CLEARED'
  | 'HR_CLEARED'
  | 'COMPLETED'
  | 'ON_HOLD';

export type ExitReason =
  | 'RESIGNATION'
  | 'RETIREMENT'
  | 'TERMINATION'
  | 'END_OF_CONTRACT'
  | 'DEATH'
  | 'ABSCONDMENT'
  | 'OTHER';

export interface OffboardingCase {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  exitReason: ExitReason;
  exitReasonDetails: string | null;
  lastWorkingDate: Date;
  status: OffboardingStatus;
  initiatedById: string;
  initiatedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  initiatedAt: Date;
  itAccessRevokedAt: Date | null;
  itAccessRevokedById: string | null;
  itAccessNotes: string | null;
  financeClearedAt: Date | null;
  financeClearedById: string | null;
  financeNotes: string | null;
  outstandingAdvances: number | null;
  outstandingLoans: number | null;
  finalSettlementAmount: number | null;
  assetsClearedAt: Date | null;
  assetsClearedById: string | null;
  assetsNotes: string | null;
  unreturned: number | null;
  hrClearedAt: Date | null;
  hrClearedById: string | null;
  hrNotes: string | null;
  completedAt: Date | null;
  onHoldReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InitiateOffboardingDto {
  userId: string;
  exitReason: ExitReason;
  exitReasonDetails?: string;
  lastWorkingDate: string | Date;
}

export interface RevokeITAccessDto {
  notes?: string;
}

export interface ProcessFinanceClearanceDto {
  outstandingAdvances?: number;
  outstandingLoans?: number;
  finalSettlementAmount?: number;
  notes?: string;
}

export interface ProcessAssetClearanceDto {
  unreturned?: number;
  notes?: string;
}

export interface ProcessHRClearanceDto {
  notes?: string;
}

class OffboardingService {
  private baseUrl = '/hr/offboarding';

  /**
   * Initiate offboarding process for an employee
   */
  async initiateOffboarding(data: InitiateOffboardingDto): Promise<OffboardingCase> {
    const response = await api.post(`${this.baseUrl}/initiate`, data);
    return response.data.data || response.data;
  }

  /**
   * Revoke IT access (immediate & independent)
   */
  async revokeITAccess(
    offboardingId: string,
    data: RevokeITAccessDto
  ): Promise<OffboardingCase> {
    const response = await api.post(`${this.baseUrl}/${offboardingId}/revoke-it-access`, data);
    return response.data.data || response.data;
  }

  /**
   * Process finance clearance
   */
  async processFinanceClearance(
    offboardingId: string,
    data: ProcessFinanceClearanceDto
  ): Promise<OffboardingCase> {
    const response = await api.post(`${this.baseUrl}/${offboardingId}/finance-clearance`, data);
    return response.data.data || response.data;
  }

  /**
   * Process asset clearance
   */
  async processAssetClearance(
    offboardingId: string,
    data: ProcessAssetClearanceDto
  ): Promise<OffboardingCase> {
    const response = await api.post(`${this.baseUrl}/${offboardingId}/asset-clearance`, data);
    return response.data.data || response.data;
  }

  /**
   * Process HR clearance (final step)
   */
  async processHRClearance(
    offboardingId: string,
    data: ProcessHRClearanceDto
  ): Promise<OffboardingCase> {
    const response = await api.post(`${this.baseUrl}/${offboardingId}/hr-clearance`, data);
    return response.data.data || response.data;
  }

  /**
   * Get all offboarding cases
   */
  async getOffboardingCases(status?: OffboardingStatus): Promise<OffboardingCase[]> {
    const params = status ? { status } : {};
    const response = await api.get(`${this.baseUrl}/cases`, { params });
    const result = response.data.data || response.data || [];
    return Array.isArray(result) ? result : [];
  }

  /**
   * Get offboarding case details
   */
  async getOffboardingDetails(offboardingId: string): Promise<OffboardingCase> {
    const response = await api.get(`${this.baseUrl}/${offboardingId}`);
    return response.data.data || response.data;
  }
}

export const offboardingService = new OffboardingService();
