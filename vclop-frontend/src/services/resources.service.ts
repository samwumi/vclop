import { api } from '@/lib/axios';

export type ResourceType = 'CUSTOMER' | 'BRANCH' | 'LOAN_PRODUCT' | 'OTHER';

export type DelegationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'REVOKED'
  | 'EXPIRED';

export interface ResourceOwnership {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedById: string;
  assignedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedAt: Date;
  isCurrent: boolean;
  reassignedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceDelegation {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  delegatedFrom: string;
  delegator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  delegatedTo: string;
  delegate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  startDate: Date;
  endDate: Date;
  status: DelegationStatus;
  permissions: {
    canRead: boolean;
    canUpdate: boolean;
    canApproveLoans: boolean;
    canDisburse: boolean;
    canCollect: boolean;
  };
  responseNotes: string | null;
  respondedAt: Date | null;
  revokedAt: Date | null;
  revokedById: string | null;
  revokeReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignOwnershipDto {
  resourceType: ResourceType;
  resourceId: string;
  userId: string;
  notes?: string;
}

export interface CreateDelegationDto {
  resourceType: ResourceType;
  resourceId: string;
  delegatedTo: string;
  startDate: string | Date;
  endDate: string | Date;
  canRead?: boolean;
  canUpdate?: boolean;
  canApproveLoans?: boolean;
  canDisburse?: boolean;
  canCollect?: boolean;
  notes?: string;
}

class ResourcesService {
  private baseUrl = '/hr/resources';

  /**
   * Get effective handler for a resource
   */
  async getEffectiveHandler(resourceType: ResourceType, resourceId: string): Promise<any> {
    const response = await api.get(`${this.baseUrl}/effective-handler/${resourceType}/${resourceId}`);
    return response.data.data || response.data;
  }

  /**
   * Assign permanent ownership
   */
  async assignOwnership(data: AssignOwnershipDto): Promise<ResourceOwnership> {
    const response = await api.post(`${this.baseUrl}/assign-ownership`, data);
    return response.data.data || response.data;
  }

  /**
   * Create temporary delegation
   */
  async createDelegation(data: CreateDelegationDto): Promise<ResourceDelegation> {
    const response = await api.post(`${this.baseUrl}/delegate`, data);
    return response.data.data || response.data;
  }

  /**
   * Accept delegation
   */
  async acceptDelegation(delegationId: string, notes?: string): Promise<ResourceDelegation> {
    const response = await api.post(`${this.baseUrl}/delegations/${delegationId}/accept`, { notes });
    return response.data.data || response.data;
  }

  /**
   * Reject delegation
   */
  async rejectDelegation(delegationId: string, notes?: string): Promise<ResourceDelegation> {
    const response = await api.post(`${this.baseUrl}/delegations/${delegationId}/reject`, { notes });
    return response.data.data || response.data;
  }

  /**
   * Revoke delegation
   */
  async revokeDelegation(delegationId: string, reason: string): Promise<ResourceDelegation> {
    const response = await api.post(`${this.baseUrl}/delegations/${delegationId}/revoke`, { reason });
    return response.data.data || response.data;
  }

  /**
   * Get my assigned resources
   */
  async getMyResources(includeHistory: boolean = false): Promise<ResourceOwnership[]> {
    const response = await api.get(`${this.baseUrl}/my-resources`, {
      params: { includeHistory: includeHistory.toString() },
    });
    const result = response.data.data || response.data || [];
    return Array.isArray(result) ? result : [];
  }

  /**
   * Get delegations sent by me
   */
  async getSentDelegations(status?: DelegationStatus): Promise<ResourceDelegation[]> {
    const params = status ? { status } : {};
    const response = await api.get(`${this.baseUrl}/delegations/sent`, { params });
    const result = response.data.data || response.data || [];
    return Array.isArray(result) ? result : [];
  }

  /**
   * Get delegations received by me
   */
  async getReceivedDelegations(status?: DelegationStatus): Promise<ResourceDelegation[]> {
    const params = status ? { status } : {};
    const response = await api.get(`${this.baseUrl}/delegations/received`, { params });
    const result = response.data.data || response.data || [];
    return Array.isArray(result) ? result : [];
  }

  /**
   * Get all delegations (admin view)
   */
  async getAllDelegations(params?: {
    status?: DelegationStatus;
    resourceType?: ResourceType;
  }): Promise<ResourceDelegation[]> {
    const response = await api.get(`${this.baseUrl}/delegations`, { params });
    const result = response.data.data || response.data || [];
    return Array.isArray(result) ? result : [];
  }
}

export const resourcesService = new ResourcesService();
