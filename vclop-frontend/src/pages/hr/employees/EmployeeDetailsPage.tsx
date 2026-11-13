import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, Plus, Edit, DollarSign, Users, Calendar, MapPin } from 'lucide-react';
import { employmentService, type CreateEmploymentDto, type ContractType } from '@/services/employment.service';
import { api } from '@/lib/axios';
import { formatDate } from '@/lib/utils';

interface Department {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

export function EmployeeDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEmploymentModal, setShowEmploymentModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);

  const [formData, setFormData] = useState<CreateEmploymentDto>({
    hireDate: '',
    jobTitle: '',
    departmentId: '',
    branchId: '',
    contractType: 'PERMANENT' as ContractType,
    salary: undefined,
  });

  const [salaryData, setSalaryData] = useState({
    newSalary: 0,
    effectiveDate: '',
  });

  // Fetch user details
  const { data: user } = useQuery({
    queryKey: ['user-details', userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}`);
      return response.data.data || response.data;
    },
    enabled: !!userId,
  });

  // Fetch employment history
  const { data: employmentHistory, isLoading } = useQuery({
    queryKey: ['employment-history', userId],
    queryFn: () => employmentService.getEmploymentHistory(userId!),
    enabled: !!userId,
  });

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      const data = response.data.data || response.data;
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch branches
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await api.get('/branches');
      const data = response.data.data || response.data;
      return Array.isArray(data) ? data : [];
    },
  });

  const createEmploymentMutation = useMutation({
    mutationFn: () => employmentService.createEmployment(userId!, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employment-history', userId] });
      alert('Employment record created successfully');
      setShowEmploymentModal(false);
      setFormData({
        hireDate: '',
        jobTitle: '',
        departmentId: '',
        branchId: '',
        contractType: 'PERMANENT',
        salary: undefined,
      });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create employment record');
    },
  });

  const updateSalaryMutation = useMutation({
    mutationFn: () => {
      const currentEmployment = employmentHistory?.find(e => e.isCurrent);
      if (!currentEmployment) throw new Error('No current employment found');
      
      return employmentService.updateSalary(userId!, {
        employmentPeriodId: currentEmployment.id,
        newSalary: salaryData.newSalary,
        effectiveDate: salaryData.effectiveDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employment-history', userId] });
      alert('Salary updated successfully');
      setShowSalaryModal(false);
      setSalaryData({ newSalary: 0, effectiveDate: '' });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update salary');
    },
  });

  const currentEmployment = employmentHistory?.find(e => e.isCurrent);
  const previousEmployment = employmentHistory?.filter(e => !e.isCurrent) || [];

  const handleCreateEmployment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hireDate || !formData.jobTitle || !formData.departmentId || !formData.branchId) {
      alert('Please fill in all required fields');
      return;
    }
    createEmploymentMutation.mutate();
  };

  const handleUpdateSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryData.newSalary || !salaryData.effectiveDate) {
      alert('Please fill in all fields');
      return;
    }
    updateSalaryMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <button onClick={() => navigate('/hr/employees')} className="btn-ghost mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Employees
      </button>

      {/* Employee Header */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center gap-4 mt-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                user?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {user?.status}
              </span>
            </div>
          </div>
          {!currentEmployment && (
            <button
              onClick={() => setShowEmploymentModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Employment
            </button>
          )}
        </div>
      </div>

      {/* Current Employment */}
      {currentEmployment ? (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-600" />
              Current Employment
            </h2>
            <button
              onClick={() => {
                setSalaryData({
                  newSalary: Number(currentEmployment.salary) || 0,
                  effectiveDate: new Date().toISOString().split('T')[0],
                });
                setShowSalaryModal(true);
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Update Salary
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Job Title</p>
              <p className="font-semibold">{currentEmployment.jobTitle}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Department</p>
              <p className="font-semibold">{currentEmployment.department?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Branch</p>
              <p className="font-semibold">{currentEmployment.branch?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Contract Type</p>
              <p className="font-semibold">{currentEmployment.contractType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Hire Date</p>
              <p className="font-semibold">{formatDate(currentEmployment.hireDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Monthly Salary</p>
              <p className="font-semibold text-brand-600 text-lg">
                {currentEmployment.salary
                  ? `₦${Number(currentEmployment.salary).toLocaleString()}`
                  : 'Not set'}
              </p>
            </div>
          </div>

          {/* Staff Loan Eligibility */}
          {currentEmployment.salary && (
            <div className="mt-6 p-4 bg-brand-50 border border-brand-200 rounded-lg">
              <h3 className="font-semibold text-brand-900 mb-3">Staff Loan Eligibility</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-brand-700">Max Monthly Deduction (25%)</p>
                  <p className="font-bold text-brand-900">
                    ₦{(Number(currentEmployment.salary) * 0.25).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-brand-700">Max Loan Amount (25% × 5 months)</p>
                  <p className="font-bold text-brand-900">
                    ₦{(Number(currentEmployment.salary) * 0.25 * 5).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-brand-700">Months Employed</p>
                  <p className="font-bold text-brand-900">
                    {Math.floor(
                      (new Date().getTime() - new Date(currentEmployment.hireDate).getTime()) /
                        (1000 * 60 * 60 * 24 * 30)
                    )}{' '}
                    months
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-8 text-center mb-6">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Employment Record</h3>
          <p className="text-gray-600 mb-4">
            This employee does not have an active employment record.
          </p>
          <button
            onClick={() => setShowEmploymentModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Employment Record
          </button>
        </div>
      )}

      {/* Employment History */}
      {previousEmployment.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Employment History</h2>
          <div className="space-y-4">
            {previousEmployment.map((emp) => (
              <div key={emp.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Job Title</p>
                    <p className="font-semibold">{emp.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Period</p>
                    <p className="text-sm">
                      {formatDate(emp.hireDate)} - {emp.terminationDate ? formatDate(emp.terminationDate) : 'Present'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Department</p>
                    <p className="text-sm">{emp.department?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Termination Type</p>
                    <p className="text-sm">{emp.terminationType || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Employment Modal */}
      {showEmploymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Add Employment Record</h3>
            </div>
            <form onSubmit={handleCreateEmployment} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hire Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Senior Officer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments?.map((dept: Department) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches?.map((branch: Branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contract Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value as ContractType })}
                    className="input-field"
                    required
                  >
                    <option value="PERMANENT">Permanent</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="TEMPORARY">Temporary</option>
                    <option value="INTERN">Intern</option>
                    <option value="PROBATION">Probation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Salary (₦)
                  </label>
                  <input
                    type="number"
                    value={formData.salary || ''}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value ? Number(e.target.value) : undefined })}
                    className="input-field"
                    placeholder="e.g. 150000"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEmploymentModal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEmploymentMutation.isPending}
                  className="btn-primary"
                >
                  {createEmploymentMutation.isPending ? 'Creating...' : 'Create Employment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Salary Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Update Salary</h3>
            </div>
            <form onSubmit={handleUpdateSalary} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Monthly Salary (₦) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={salaryData.newSalary}
                  onChange={(e) => setSalaryData({ ...salaryData, newSalary: Number(e.target.value) })}
                  className="input-field"
                  placeholder="e.g. 180000"
                  min="1000"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={salaryData.effectiveDate}
                  onChange={(e) => setSalaryData({ ...salaryData, effectiveDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateSalaryMutation.isPending}
                  className="btn-primary"
                >
                  {updateSalaryMutation.isPending ? 'Updating...' : 'Update Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
