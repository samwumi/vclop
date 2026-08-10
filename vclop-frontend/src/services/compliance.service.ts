import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { LoanApplicationStatus } from '@/types/domain.types';

export type WorkflowRecommendation = 'APPROVE' | 'REJECT' | 'RETURN' | 'ESCALATE' | 'REQUEST_INFORMATION';

export interface ComplianceQueueItem {
  id: string;
  applicationNumber: string;
  customerId: string;
  amount: number;
  tenureDays: number;
  purpose: string | null;
  status: LoanApplicationStatus;
  submittedAt: string | null;
  createdAt: string;
  customer: {
    customerNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
    bvn?: string | null;
    nin?: string | null;
    branchId?: string | null;
  } | null;
  loanProduct: { name: string } | null;
}

export interface ComplianceAssessment {
  id: string;
  loanApplicationId: string;
  assignedToId: string | null;
  bankStatementNotes: string | null;
  incomeAssessment: string | null;
  affordabilityScore: number | null;
  cashFlowAssessment: string | null;
  riskScore: number | null;
  recommendation: WorkflowRecommendation | null;
  recommendationNotes: string | null;
  bvnVerifiedAt: string | null;
  ninVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  employerVerifiedAt: string | null;
  businessVerifiedAt: string | null;
  residenceVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FieldVisit {
  id: string;
  loanApplicationId: string;
  visitType: string;
  conductedById: string | null;
  latitude: number | null;
  longitude: number | null;
  arrivedAt: string | null;
  completedAt: string | null;
  findings: string | null;
  photos: string | null;
  createdAt: string;
}

export const complianceService = {
  /** GET /compliance/queue — returns COMPLIANCE_REVIEW + AWAITING_INFORMATION applications */
  async queue(): Promise<ComplianceQueueItem[]> {
    const { data } = await api.get<ApiResponse<ComplianceQueueItem[]>>('/compliance/queue');
    return data.data ?? [];
  },

  /** GET /compliance/applications/:id/assessment */
  async getAssessment(applicationId: string): Promise<ComplianceAssessment | null> {
    const { data } = await api.get<ApiResponse<ComplianceAssessment | null>>(
      `/compliance/applications/${applicationId}/assessment`,
    );
    return data.data ?? null;
  },

  /** PUT /compliance/applications/:id/assessment */
  async saveAssessment(
    applicationId: string,
    payload: {
      bankStatementNotes?: string;
      incomeAssessment?: string;
      affordabilityScore?: number;
      cashFlowAssessment?: string;
      riskScore?: number;
      recommendation?: WorkflowRecommendation;
      recommendationNotes?: string;
    },
  ): Promise<ComplianceAssessment> {
    const { data } = await api.put<ApiResponse<ComplianceAssessment>>(
      `/compliance/applications/${applicationId}/assessment`,
      payload,
    );
    return data.data!;
  },

  /** GET /compliance/applications/:id/field-visits */
  async getFieldVisits(applicationId: string): Promise<FieldVisit[]> {
    const { data } = await api.get<ApiResponse<FieldVisit[]>>(
      `/compliance/applications/${applicationId}/field-visits`,
    );
    return data.data ?? [];
  },

  /** POST /compliance/applications/:id/field-visits */
  async addFieldVisit(
    applicationId: string,
    payload: {
      visitType: string;
      latitude?: number;
      longitude?: number;
      arrivedAt?: string;
      completedAt?: string;
      findings?: string;
      photos?: string;
    },
  ): Promise<FieldVisit> {
    const { data } = await api.post<ApiResponse<FieldVisit>>(
      `/compliance/applications/${applicationId}/field-visits`,
      payload,
    );
    return data.data!;
  },
  /** GET customer documents via Customer 360 endpoint */
  async getCustomerDocuments(customerId: string): Promise<Array<{
    id: string;
    documentTypeId: string;
    status: string;
    fileKey: string;
    fileUrl: string;
    originalName: string;
    mimeType: string;
    size: number;
    rejectionReason: string | null;
    verifiedAt: string | null;
    createdAt: string;
    documentType: { name: string; code: string } | null;
  }>> {
    // Customer 360 returns { profile, documents, formData, timeline }
    // TransformInterceptor wraps it: axios response.data.data = { profile, documents, ... }
    const { data } = await api.get<ApiResponse<{
      profile: unknown;
      documents: unknown[];
    }>>(`/customers/${customerId}`);
    return (data.data?.documents ?? []) as Array<{
      id: string; documentTypeId: string; status: string;
      fileKey: string; fileUrl: string; originalName: string;
      mimeType: string; size: number; rejectionReason: string | null;
      verifiedAt: string | null; createdAt: string;
      documentType: { name: string; code: string } | null;
    }>;
  },

  /** GET /compliance/customers/:customerId/field-visits */
  async getCustomerFieldVisits(customerId: string): Promise<FieldVisit[]> {
    const { data } = await api.get<ApiResponse<FieldVisit[]>>(
      `/compliance/customers/${customerId}/field-visits`,
    );
    return data.data ?? [];
  },

  /** POST /compliance/customers/:customerId/field-visits */
  async addCustomerFieldVisit(
    customerId: string,
    payload: {
      visitType: string;
      latitude?: number;
      longitude?: number;
      arrivedAt?: string;
      completedAt?: string;
      findings?: string;
      photos?: string;
    },
  ): Promise<FieldVisit> {
    const { data } = await api.post<ApiResponse<FieldVisit>>(
      `/compliance/customers/${customerId}/field-visits`,
      payload,
    );
    return data.data!;
  },
};
