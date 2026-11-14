import { api } from '@/lib/axios';

export type ContractType = 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'INTERN' | 'PROBATION';

export interface EmploymentPeriod {
  id: string;
  userId: string;
  periodNumber: number;
  hireDate: string;
  terminationDate: string | null;
  lastWorkingDay: string | null;
  jobTitle: string;
  departmentId: string;
  branchId: string;
  contractType: ContractType;
  salary: number | null;
  salaryEffectiveDate: string | null;
  terminationType: string | null;
  terminationReason: string | null;
  isVoluntary: boolean | null;
  rehireEligible: boolean;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  department?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  };
}

export interface CreateEmploymentDto {
  hireDate: string;
  jobTitle: string;
  departmentId: string;
  branchId: string;
  contractType: ContractType;
  salary?: number;
}

export interface UpdateSalaryDto {
  employmentPeriodId: string;
  newSalary: number;
  effectiveDate: string;
}

export interface TransferEmployeeDto {
  newDepartmentId?: string;
  newBranchId?: string;
  effectiveDate: string;
}

export interface EmployeeGuarantor {
  id: string;
  employmentPeriodId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  relationship: string;
  address?: string;
  occupation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuarantorDto {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  relationship: string;
  address?: string;
  occupation?: string;
}

export interface EmployeeNextOfKin {
  id: string;
  employmentPeriodId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  relationship: string;
  address?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNextOfKinDto {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  relationship: string;
  address?: string;
  isPrimary?: boolean;
}

class EmploymentService {
  /**
   * Get employment history for a user
   */
  async getEmploymentHistory(userId: string): Promise<EmploymentPeriod[]> {
    const response = await api.get(`/hr/employees/${userId}/employment-history`);
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get current employment for a user
   */
  async getCurrentEmployment(userId: string): Promise<EmploymentPeriod | null> {
    try {
      const response = await api.get(`/hr/employees/${userId}/current-employment`);
      return response.data.data || response.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create employment record for a user
   */
  async createEmployment(userId: string, data: CreateEmploymentDto): Promise<EmploymentPeriod> {
    const response = await api.post(`/hr/employees/${userId}/employment`, data);
    return response.data.data || response.data;
  }

  /**
   * Update employee salary
   */
  async updateSalary(userId: string, data: UpdateSalaryDto): Promise<EmploymentPeriod> {
    const response = await api.put(`/hr/employees/${userId}/salary`, data);
    return response.data.data || response.data;
  }

  /**
   * Transfer employee to new department/branch
   */
  async transferEmployee(userId: string, data: TransferEmployeeDto): Promise<EmploymentPeriod> {
    const response = await api.put(`/hr/employees/${userId}/transfer`, data);
    return response.data.data || response.data;
  }

  /**
   * Check rehire eligibility
   */
  async checkRehireEligibility(userId: string): Promise<{ eligible: boolean; reason?: string }> {
    const response = await api.get(`/hr/employees/${userId}/rehire-eligibility`);
    return response.data.data || response.data;
  }

  /**
   * Rehire a former employee
   */
  async rehireEmployee(userId: string, data: CreateEmploymentDto): Promise<EmploymentPeriod> {
    const response = await api.post(`/hr/employees/${userId}/rehire`, data);
    return response.data.data || response.data;
  }

  /**
   * Get guarantors for employment period
   */
  async getGuarantors(employmentPeriodId: string): Promise<EmployeeGuarantor[]> {
    const response = await api.get(`/hr/employees/employment/${employmentPeriodId}/guarantors`);
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Create guarantor
   */
  async createGuarantor(employmentPeriodId: string, data: CreateGuarantorDto): Promise<EmployeeGuarantor> {
    const response = await api.post(`/hr/employees/employment/${employmentPeriodId}/guarantors`, data);
    return response.data.data || response.data;
  }

  /**
   * Update guarantor
   */
  async updateGuarantor(guarantorId: string, data: Partial<CreateGuarantorDto>): Promise<EmployeeGuarantor> {
    const response = await api.put(`/hr/employees/guarantors/${guarantorId}`, data);
    return response.data.data || response.data;
  }

  /**
   * Get next of kin for employment period
   */
  async getNextOfKin(employmentPeriodId: string): Promise<EmployeeNextOfKin[]> {
    const response = await api.get(`/hr/employees/employment/${employmentPeriodId}/next-of-kin`);
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Create next of kin
   */
  async createNextOfKin(employmentPeriodId: string, data: CreateNextOfKinDto): Promise<EmployeeNextOfKin> {
    const response = await api.post(`/hr/employees/employment/${employmentPeriodId}/next-of-kin`, data);
    return response.data.data || response.data;
  }

  /**
   * Update next of kin
   */
  async updateNextOfKin(nextOfKinId: string, data: Partial<CreateNextOfKinDto>): Promise<EmployeeNextOfKin> {
    const response = await api.put(`/hr/employees/next-of-kin/${nextOfKinId}`, data);
    return response.data.data || response.data;
  }
}

export const employmentService = new EmploymentService();
