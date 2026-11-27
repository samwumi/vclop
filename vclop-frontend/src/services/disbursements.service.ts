import api from './api';

export interface DisbursementTransaction {
  id: string;
  entityType: 'LOAN' | 'TRANSPORT' | 'EXPENSE' | 'STAFF_LOAN' | 'SALARY' | 'BONUS' | 'OTHER';
  entityId: string;
  recipientType: 'CUSTOMER' | 'EMPLOYEE' | 'VENDOR' | 'OTHER';
  recipientId: string;
  recipientName: string | null;
  amount: number;
  currency: string;
  purpose: string | null;
  accountNumber: string | null;
  accountName: string | null;
  bankCode: string | null;
  bankName: string | null;
  paystackTransferCode: string | null;
  paystackRecipientCode: string | null;
  paystackReference: string | null;
  paystackStatus: string | null;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REVERSED' | 'CANCELLED';
  initiatedById: string | null;
  initiatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  initiatedAt: string;
  completedAt: string | null;
  failureReason: string | null;
  retryCount: number;
  lastRetryAt: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export interface DisbursementsResponse {
  success: boolean;
  data: DisbursementTransaction[];
}

export interface DisbursementResponse {
  success: boolean;
  data: DisbursementTransaction;
}

class DisbursementsService {
  /**
   * Get all pending disbursements
   */
  async getPending(entityType?: string): Promise<DisbursementsResponse> {
    const params = entityType ? { entityType } : {};
    const response = await api.get('/disbursements/pending', { params });
    return response.data;
  }

  /**
   * Get all failed disbursements
   */
  async getFailed(entityType?: string): Promise<DisbursementsResponse> {
    const params = entityType ? { entityType } : {};
    const response = await api.get('/disbursements/failed', { params });
    return response.data;
  }

  /**
   * Get specific disbursement details
   */
  async getOne(id: string): Promise<DisbursementResponse> {
    const response = await api.get(`/disbursements/${id}`);
    return response.data;
  }

  /**
   * Retry failed disbursement
   */
  async retry(id: string): Promise<DisbursementResponse> {
    const response = await api.post(`/disbursements/${id}/retry`);
    return response.data;
  }

  /**
   * Get disbursements for specific entity
   */
  async getForEntity(entityType: string, entityId: string): Promise<DisbursementsResponse> {
    const response = await api.get(`/disbursements/entity/${entityType}/${entityId}`);
    return response.data;
  }
}

export default new DisbursementsService();
