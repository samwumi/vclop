import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface DisbursementTransaction {
  id: string;
  entityType: string;
  entityId: string;
  recipientType: string;
  recipientId: string;
  recipientName: string | null;
  amount: number;
  status: string;
  initiatedAt: string;
  failureReason: string | null;
}

class DisbursementsService {
  async getPending(entityType?: string) {
    const params = entityType ? { entityType } : {};
    const response = await axios.get(`${API_BASE_URL}/disbursements/pending`, { params });
    return response.data;
  }

  async getFailed(entityType?: string) {
    const params = entityType ? { entityType } : {};
    const response = await axios.get(`${API_BASE_URL}/disbursements/failed`, { params });
    return response.data;
  }

  async getOne(id: string) {
    const response = await axios.get(`${API_BASE_URL}/disbursements/${id}`);
    return response.data;
  }

  async retry(id: string) {
    const response = await axios.post(`${API_BASE_URL}/disbursements/${id}/retry`);
    return response.data;
  }

  async getForEntity(entityType: string, entityId: string) {
    const response = await axios.get(`${API_BASE_URL}/disbursements/entity/${entityType}/${entityId}`);
    return response.data;
  }
}

export default new DisbursementsService();
