import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, Plus, Edit, Trash2, User, Users as UsersIcon, Shield, CheckCircle, XCircle, AlertCircle, Lock, Unlock } from 'lucide-react';
import { 
  employmentService, 
  type CreateEmploymentDto, 
  type ContractType,
  type CreateGuarantorDto,
  type CreateNextOfKinDto,
  type EmployeeGuarantor,
  type EmployeeNextOfKin
} from '@/services/employment.service';
import { api } from '@/lib/axios';
import { formatDate } from '@/lib/utils';
import { SubmissionStatusBadge } from '@/components/SubmissionStatusBadge';

interface Department {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

type TabType = 'details' | 'guarantors' | 'next-of-kin';

export function EmployeeDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [showEmploymentModal, setShowEmploymentModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showGuarantorModal, setShowGuarantorModal] = useState(false);
  const [showNextOfKinModal, setShowNextOfKinModal] = useState(false);
  const [editingGuarantor, setEditingGuarantor] = useState<EmployeeGuarantor | null>(null);
  const [editingNextOfKin, setEditingNextOfKin] = useState<EmployeeNextOfKin | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

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

  const [guarantorData, setGuarantorData] = useState<CreateGuarantorDto>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    relationship: '',
    address: '',
    occupation: '',
  });

  const [nextOfKinData, setNextOfKinData] = useState<CreateNextOfKinDto>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    relationship: '',
    address: '',
    isPrimary: false,
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

  const currentEmployment = employmentHistory?.find(e => e.isCurrent);

  // Fetch guarantors
  const { data: guarantors = [] } = useQuery({
    queryKey: ['employee-guarantors', currentEmployment?.id],
    queryFn: () => employmentService.getGuarantors(currentEmployment!.id),
    enabled: !!currentEmployment?.id,
  });

  // Fetch next of kin
  const { data: nextOfKin = [] } = useQuery({
    queryKey: ['employee-next-of-kin', currentEmployment?.id],
    queryFn: () => employmentService.getNextOfKin(currentEmployment!.id),
    enabled: !!currentEmployment?.id,
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

  const createGuarantorMutation = useMutation({
    mutationFn: () => {
      if (!currentEmployment) throw new Error('No current employment found');
      return employmentService.createGuarantor(currentEmployment.id, guarantorData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-guarantors', currentEmployment?.id] });
      alert('Guarantor added successfully');
      setShowGuarantorModal(false);
      resetGuarantorForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to add guarantor');
    },
  });

  const updateGuarantorMutation = useMutation({
    mutationFn: () => {
      if (!editingGuarantor) throw new Error('No guarantor selected');
      return employmentService.updateGuarantor(editingGuarantor.id, guarantorData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-guarantors', currentEmployment?.id] });
      alert('Guarantor updated successfully');
      setShowGuarantorModal(false);
      setEditingGuarantor(null);
      resetGuarantorForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update guarantor');
    },
  });

  const createNextOfKinMutation = useMutation({
    mutationFn: () => {
      if (!currentEmployment) throw new Error('No current employment found');
      return employmentService.createNextOfKin(currentEmployment.id, nextOfKinData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-next-of-kin', currentEmployment?.id] });
      alert('Next of kin added successfully');
      setShowNextOfKinModal(false);
      resetNextOfKinForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to add next of kin');
    },
  });

  const updateNextOfKinMutation = useMutation({
    mutationFn: () => {
      if (!editingNextOfKin) throw new Error('No next of kin selected');
      return employmentService.updateNextOfKin(editingNextOfKin.id, nextOfKinData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-next-of-kin', currentEmployment?.id] });
      alert('Next of kin updated successfully');
      setShowNextOfKinModal(false);
      setEditingNextOfKin(null);
      resetNextOfKinForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update next of kin');
    },
  });

  // Workflow mutations
  const approveMutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('No user ID');
      return employmentService.approveEmployment(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employment-history', userId] });
      queryClient.invalidateQueries({ queryKey: ['pending-submissions'] });
      alert('Employment data approved successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to approve employment');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (notes: string) => {
      if (!userId) throw new Error('No user ID');
      return employmentService.rejectEmployment(userId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employment-history', userId] });
      queryClient.invalidateQueries({ queryKey: ['pending-submissions'] });
      alert('Employment data rejected');
      setShowRejectModal(false);
      setReviewNotes('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to reject employment');
    },
  });

  const requestRevisionMutation = useMutation({
    mutationFn: (notes: string) => {
      if (!userId) throw new Error('No user ID');
      return employmentService.requestRevision(userId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employment-history', userId] });
      queryClient.invalidateQueries({ queryKey: ['pending-submissions'] });
      alert('Revision requested successfully');
      setShowRevisionModal(false);
      setReviewNotes('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to request revision');
    },
  });

  const grantEditRightsMutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('No user ID');
      return employmentService.grantEditRights(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employment-history', userId] });
      alert('Edit rights granted successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to grant edit rights');
    },
  });

  const revokeEditRightsMutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('No user ID');
      return employmentService.revokeEditRights(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employment-history', userId] });
      alert('Edit rights revoked successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to revoke edit rights');
    },
  });

  const previousEmployment = employmentHistory?.filter(e => !e.isCurrent) || [];

  const resetGuarantorForm = () => {
    setGuarantorData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      relationship: '',
      address: '',
      occupation: '',
    });
  };

  const resetNextOfKinForm = () => {
    setNextOfKinData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      relationship: '',
      address: '',
      isPrimary: false,
    });
  };

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

  const handleGuarantorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guarantorData.firstName || !guarantorData.lastName || !guarantorData.phone || !guarantorData.relationship) {
      alert('Please fill in all required fields');
      return;
    }
    if (editingGuarantor) {
      updateGuarantorMutation.mutate();
    } else {
      createGuarantorMutation.mutate();
    }
  };

  const handleNextOfKinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextOfKinData.firstName || !nextOfKinData.lastName || !nextOfKinData.phone || !nextOfKinData.relationship) {
      alert('Please fill in all required fields');
      return;
    }
    if (editingNextOfKin) {
      updateNextOfKinMutation.mutate();
    } else {
      createNextOfKinMutation.mutate();
    }
  };

  const handleEditGuarantor = (guarantor: EmployeeGuarantor) => {
    setEditingGuarantor(guarantor);
    setGuarantorData({
      firstName: guarantor.firstName,
      lastName: guarantor.lastName,
      phone: guarantor.phone,
      email: guarantor.email || '',
      relationship: guarantor.relationship,
      address: guarantor.address || '',
      occupation: guarantor.occupation || '',
    });
    setShowGuarantorModal(true);
  };

  const handleEditNextOfKin = (nok: EmployeeNextOfKin) => {
    setEditingNextOfKin(nok);
    setNextOfKinData({
      firstName: nok.firstName,
      lastName: nok.lastName,
      phone: nok.phone,
      email: nok.email || '',
      relationship: nok.relationship,
      address: nok.address || '',
      isPrimary: nok.isPrimary,
    });
    setShowNextOfKinModal(true);
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
              {currentEmployment?.submissionStatus && (
                <SubmissionStatusBadge status={currentEmployment.submissionStatus} />
              )}
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

      {/* HR Review Section */}
      {currentEmployment && (currentEmployment.submissionStatus === 'SUBMITTED' || currentEmployment.submissionStatus === 'UNDER_REVIEW') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Review Employment Submission
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm('Approve this employment submission? The data will be locked.')) {
                  approveMutation.mutate();
                }
              }}
              disabled={approveMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={rejectMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={() => setShowRevisionModal(true)}
              disabled={requestRevisionMutation.isPending}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Request Revision
            </button>
          </div>
        </div>
      )}

      {/* Edit Rights Control */}
      {currentEmployment && currentEmployment.submissionStatus === 'APPROVED' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {currentEmployment.isEditable ? <Unlock className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-gray-600" />}
            Edit Rights Control
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 mb-1">
                {currentEmployment.isEditable 
                  ? 'Employee can currently edit their data' 
                  : 'Employee data is currently locked'}
              </p>
              <p className="text-xs text-gray-500">
                Control whether the employee can make changes to approved data
              </p>
            </div>
            <button
              onClick={() => {
                if (currentEmployment.isEditable) {
                  if (confirm('Lock the data? Employee will not be able to edit.')) {
                    revokeEditRightsMutation.mutate();
                  }
                } else {
                  if (confirm('Unlock the data for editing? Employee will be able to make changes.')) {
                    grantEditRightsMutation.mutate();
                  }
                }
              }}
              disabled={grantEditRightsMutation.isPending || revokeEditRightsMutation.isPending}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                currentEmployment.isEditable 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {currentEmployment.isEditable ? (
                <>
                  <Lock className="w-4 h-4" />
                  Lock Data
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  Unlock for Editing
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Review History */}
      {currentEmployment && currentEmployment.reviewedAt && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Review History</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Reviewed by:</span>
              <span className="ml-2 font-medium">{currentEmployment.reviewedBy?.firstName} {currentEmployment.reviewedBy?.lastName}</span>
            </div>
            <div>
              <span className="text-gray-600">Reviewed on:</span>
              <span className="ml-2 font-medium">{formatDate(currentEmployment.reviewedAt)}</span>
            </div>
            {currentEmployment.reviewNotes && (
              <div>
                <span className="text-gray-600">Notes:</span>
                <p className="mt-1 p-3 bg-gray-50 rounded border text-gray-700">{currentEmployment.reviewNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      {currentEmployment && (
        <div className="bg-white border rounded-lg">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-3 font-medium flex items-center gap-2 ${
                  activeTab === 'details'
                    ? 'border-b-2 border-brand-500 text-brand-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Employee Details
              </button>
              <button
                onClick={() => setActiveTab('guarantors')}
                className={`px-6 py-3 font-medium flex items-center gap-2 ${
                  activeTab === 'guarantors'
                    ? 'border-b-2 border-brand-500 text-brand-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                Guarantors ({guarantors.length})
              </button>
              <button
                onClick={() => setActiveTab('next-of-kin')}
                className={`px-6 py-3 font-medium flex items-center gap-2 ${
                  activeTab === 'next-of-kin'
                    ? 'border-b-2 border-brand-500 text-brand-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UsersIcon className="w-4 h-4" />
                Next of Kin ({nextOfKin.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Employee Details Tab */}
            {activeTab === 'details' && (
              <div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
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
                  <div className="p-4 bg-brand-50 border border-brand-200 rounded-lg">
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

                {/* Employment History */}
                {previousEmployment.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Employment History</h3>
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
              </div>
            )}

            {/* Guarantors Tab */}
            {activeTab === 'guarantors' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Guarantors</h2>
                  <button
                    onClick={() => {
                      setEditingGuarantor(null);
                      resetGuarantorForm();
                      setShowGuarantorModal(true);
                    }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Guarantor
                  </button>
                </div>

                {guarantors.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No guarantors added yet</p>
                    <p className="text-sm text-gray-500 mt-1">Add guarantors for this employee</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {guarantors.map((guarantor) => (
                      <div key={guarantor.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {guarantor.firstName} {guarantor.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">{guarantor.relationship}</p>
                          </div>
                          <button
                            onClick={() => handleEditGuarantor(guarantor)}
                            className="text-brand-600 hover:text-brand-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">Phone:</span>
                            <span className="ml-2 font-medium">{guarantor.phone}</span>
                          </div>
                          {guarantor.email && (
                            <div>
                              <span className="text-gray-500">Email:</span>
                              <span className="ml-2">{guarantor.email}</span>
                            </div>
                          )}
                          {guarantor.occupation && (
                            <div>
                              <span className="text-gray-500">Occupation:</span>
                              <span className="ml-2">{guarantor.occupation}</span>
                            </div>
                          )}
                          {guarantor.address && (
                            <div>
                              <span className="text-gray-500">Address:</span>
                              <span className="ml-2">{guarantor.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Next of Kin Tab */}
            {activeTab === 'next-of-kin' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Next of Kin</h2>
                  <button
                    onClick={() => {
                      setEditingNextOfKin(null);
                      resetNextOfKinForm();
                      setShowNextOfKinModal(true);
                    }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Next of Kin
                  </button>
                </div>

                {nextOfKin.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No next of kin added yet</p>
                    <p className="text-sm text-gray-500 mt-1">Add next of kin for this employee</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nextOfKin.map((nok) => (
                      <div key={nok.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">
                                {nok.firstName} {nok.lastName}
                              </h3>
                              {nok.isPrimary && (
                                <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-semibold rounded">
                                  Primary
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{nok.relationship}</p>
                          </div>
                          <button
                            onClick={() => handleEditNextOfKin(nok)}
                            className="text-brand-600 hover:text-brand-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">Phone:</span>
                            <span className="ml-2 font-medium">{nok.phone}</span>
                          </div>
                          {nok.email && (
                            <div>
                              <span className="text-gray-500">Email:</span>
                              <span className="ml-2">{nok.email}</span>
                            </div>
                          )}
                          {nok.address && (
                            <div>
                              <span className="text-gray-500">Address:</span>
                              <span className="ml-2">{nok.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Employment State */}
      {!currentEmployment && (
        <div className="bg-white border rounded-lg p-8 text-center">
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

      {/* Guarantor Modal */}
      {showGuarantorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">
                {editingGuarantor ? 'Edit Guarantor' : 'Add Guarantor'}
              </h3>
            </div>
            <form onSubmit={handleGuarantorSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guarantorData.firstName}
                    onChange={(e) => setGuarantorData({ ...guarantorData, firstName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guarantorData.lastName}
                    onChange={(e) => setGuarantorData({ ...guarantorData, lastName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={guarantorData.phone}
                    onChange={(e) => setGuarantorData({ ...guarantorData, phone: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={guarantorData.email}
                    onChange={(e) => setGuarantorData({ ...guarantorData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guarantorData.relationship}
                    onChange={(e) => setGuarantorData({ ...guarantorData, relationship: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Friend, Colleague"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={guarantorData.occupation}
                    onChange={(e) => setGuarantorData({ ...guarantorData, occupation: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={guarantorData.address}
                    onChange={(e) => setGuarantorData({ ...guarantorData, address: e.target.value })}
                    className="input-field"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowGuarantorModal(false);
                    setEditingGuarantor(null);
                    resetGuarantorForm();
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGuarantorMutation.isPending || updateGuarantorMutation.isPending}
                  className="btn-primary"
                >
                  {editingGuarantor
                    ? updateGuarantorMutation.isPending ? 'Updating...' : 'Update Guarantor'
                    : createGuarantorMutation.isPending ? 'Adding...' : 'Add Guarantor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Next of Kin Modal */}
      {showNextOfKinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">
                {editingNextOfKin ? 'Edit Next of Kin' : 'Add Next of Kin'}
              </h3>
            </div>
            <form onSubmit={handleNextOfKinSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nextOfKinData.firstName}
                    onChange={(e) => setNextOfKinData({ ...nextOfKinData, firstName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nextOfKinData.lastName}
                    onChange={(e) => setNextOfKinData({ ...nextOfKinData, lastName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={nextOfKinData.phone}
                    onChange={(e) => setNextOfKinData({ ...nextOfKinData, phone: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={nextOfKinData.email}
                    onChange={(e) => setNextOfKinData({ ...nextOfKinData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nextOfKinData.relationship}
                    onChange={(e) => setNextOfKinData({ ...nextOfKinData, relationship: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Spouse, Parent, Sibling"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nextOfKinData.isPrimary}
                      onChange={(e) => setNextOfKinData({ ...nextOfKinData, isPrimary: e.target.checked })}
                      className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Set as Primary Contact</span>
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={nextOfKinData.address}
                    onChange={(e) => setNextOfKinData({ ...nextOfKinData, address: e.target.value })}
                    className="input-field"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowNextOfKinModal(false);
                    setEditingNextOfKin(null);
                    resetNextOfKinForm();
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createNextOfKinMutation.isPending || updateNextOfKinMutation.isPending}
                  className="btn-primary"
                >
                  {editingNextOfKin
                    ? updateNextOfKinMutation.isPending ? 'Updating...' : 'Update Next of Kin'
                    : createNextOfKinMutation.isPending ? 'Adding...' : 'Add Next of Kin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="border-b p-6">
              <h3 className="text-xl font-semibold text-red-700">Reject Employment Submission</h3>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!reviewNotes.trim()) {
                alert('Please provide rejection notes');
                return;
              }
              rejectMutation.mutate(reviewNotes);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="input-field"
                  rows={4}
                  placeholder="Explain why this submission is being rejected..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setReviewNotes('');
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Reject Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="border-b p-6">
              <h3 className="text-xl font-semibold text-yellow-700">Request Revision</h3>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!reviewNotes.trim()) {
                alert('Please provide revision notes');
                return;
              }
              requestRevisionMutation.mutate(reviewNotes);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Revision Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="input-field"
                  rows={4}
                  placeholder="Explain what needs to be revised..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowRevisionModal(false);
                    setReviewNotes('');
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestRevisionMutation.isPending}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  {requestRevisionMutation.isPending ? 'Requesting...' : 'Request Revision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
