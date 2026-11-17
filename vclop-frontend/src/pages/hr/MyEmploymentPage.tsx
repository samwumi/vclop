import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Shield, Users as UsersIcon, Plus, Edit, AlertCircle, Send, CheckCircle, Trash2 } from 'lucide-react';
import { 
  employmentService, 
  type CreateGuarantorDto,
  type CreateNextOfKinDto,
  type EmployeeGuarantor,
  type EmployeeNextOfKin,
  type CreateEmploymentDto,
  type EmployeeWorkHistory,
  type CreateWorkHistoryDto,
} from '@/services/employment.service';
import { useAuthStore } from '@/stores/auth.store';
import { SubmissionStatusBadge } from '@/components/SubmissionStatusBadge';
import { formatDate } from '@/lib/utils';
import { branchesService } from '@/services/branches.service';

type TabType = 'details' | 'guarantors' | 'next-of-kin';

export function MyEmploymentPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [showGuarantorModal, setShowGuarantorModal] = useState(false);
  const [showNextOfKinModal, setShowNextOfKinModal] = useState(false);
  const [showCreateEmploymentModal, setShowCreateEmploymentModal] = useState(false);
  const [showWorkHistoryModal, setShowWorkHistoryModal] = useState(false);
  const [editingGuarantor, setEditingGuarantor] = useState<EmployeeGuarantor | null>(null);
  const [editingNextOfKin, setEditingNextOfKin] = useState<EmployeeNextOfKin | null>(null);
  const [editingWorkHistory, setEditingWorkHistory] = useState<EmployeeWorkHistory | null>(null);

  const [employmentData, setEmploymentData] = useState<Omit<CreateEmploymentDto, 'salary'>>({
    hireDate: '',
    jobTitle: '',
    departmentId: '',
    branchId: '',
    contractType: 'PERMANENT',
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

  const [workHistoryData, setWorkHistoryData] = useState<CreateWorkHistoryDto>({
    companyName: '',
    position: '',
    startDate: '',
    endDate: '',
    responsibilities: '',
    reasonForLeaving: '',
  });

  // Fetch current employment for logged-in user
  const { data: currentEmployment, isLoading } = useQuery({
    queryKey: ['my-current-employment'],
    queryFn: async () => {
      try {
        return await employmentService.getCurrentEmployment(user?.id!);
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  // Fetch departments for create form
  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/departments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      return data.data?.data || data.data || [];
    },
  });
  const departments = departmentsResponse || [];

  // Fetch branches for create form
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesService.list(),
  });
  const branches = Array.isArray(branchesData) ? branchesData : (branchesData?.data || []);

  // Create my employment record mutation
  const createMyEmploymentMutation = useMutation({
    mutationFn: () => employmentService.createMyEmployment(employmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-current-employment'] });
      queryClient.invalidateQueries({ queryKey: ['my-employment-history'] });
      alert('Employment record created successfully!');
      setShowCreateEmploymentModal(false);
      setEmploymentData({
        hireDate: '',
        jobTitle: '',
        departmentId: '',
        branchId: '',
        contractType: 'PERMANENT',
      });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create employment record');
    },
  });

  // Fetch guarantors
  const { data: guarantors = [] } = useQuery({
    queryKey: ['my-guarantors', currentEmployment?.id],
    queryFn: () => employmentService.getGuarantors(currentEmployment!.id),
    enabled: !!currentEmployment?.id,
  });

  // Fetch next of kin
  const { data: nextOfKin = [] } = useQuery({
    queryKey: ['my-next-of-kin', currentEmployment?.id],
    queryFn: () => employmentService.getNextOfKin(currentEmployment!.id),
    enabled: !!currentEmployment?.id,
  });

  // Fetch work history (previous jobs from OTHER companies)
  const { data: workHistory = [] } = useQuery({
    queryKey: ['my-work-history', user?.id],
    queryFn: () => employmentService.getWorkHistory(user?.id!),
    enabled: !!user?.id,
  });

  const createGuarantorMutation = useMutation({
    mutationFn: () => {
      if (!currentEmployment) throw new Error('No current employment found');
      return employmentService.createGuarantor(currentEmployment.id, guarantorData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-guarantors', currentEmployment?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['my-guarantors', currentEmployment?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['my-next-of-kin', currentEmployment?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['my-next-of-kin', currentEmployment?.id] });
      alert('Next of kin updated successfully');
      setShowNextOfKinModal(false);
      setEditingNextOfKin(null);
      resetNextOfKinForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update next of kin');
    },
  });

  // Work History mutations
  const createWorkHistoryMutation = useMutation({
    mutationFn: () => employmentService.createWorkHistory(user?.id!, workHistoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-work-history', user?.id] });
      alert('Work history added successfully');
      setShowWorkHistoryModal(false);
      resetWorkHistoryForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to add work history');
    },
  });

  const updateWorkHistoryMutation = useMutation({
    mutationFn: () => {
      if (!editingWorkHistory) throw new Error('No work history selected');
      return employmentService.updateWorkHistory(editingWorkHistory.id, workHistoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-work-history', user?.id] });
      alert('Work history updated successfully');
      setShowWorkHistoryModal(false);
      setEditingWorkHistory(null);
      resetWorkHistoryForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update work history');
    },
  });

  const deleteWorkHistoryMutation = useMutation({
    mutationFn: (workHistoryId: string) => employmentService.deleteWorkHistory(workHistoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-work-history', user?.id] });
      alert('Work history deleted successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete work history');
    },
  });

  // Submit employment for review mutation
  const submitMutation = useMutation({
    mutationFn: () => employmentService.submitForReview(user?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-current-employment'] });
      alert('Your employment data has been submitted for HR review!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to submit employment data');
    },
  });

  // Check if can submit
  const canSubmit = currentEmployment && 
    (currentEmployment.submissionStatus === 'DRAFT' || currentEmployment.submissionStatus === 'NEEDS_REVISION') &&
    guarantors.length > 0 && 
    nextOfKin.length > 0;

  const isEditable = currentEmployment?.isEditable ?? true;
  const isPending = currentEmployment?.submissionStatus === 'SUBMITTED' || currentEmployment?.submissionStatus === 'UNDER_REVIEW';

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

  const resetWorkHistoryForm = () => {
    setWorkHistoryData({
      companyName: '',
      position: '',
      startDate: '',
      endDate: '',
      responsibilities: '',
      reasonForLeaving: '',
    });
  };

  const handleWorkHistorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workHistoryData.companyName || !workHistoryData.position || !workHistoryData.startDate) {
      alert('Please fill in all required fields (Company, Position, Start Date)');
      return;
    }
    if (editingWorkHistory) {
      updateWorkHistoryMutation.mutate();
    } else {
      createWorkHistoryMutation.mutate();
    }
  };

  const handleEditWorkHistory = (wh: EmployeeWorkHistory) => {
    setEditingWorkHistory(wh);
    setWorkHistoryData({
      companyName: wh.companyName,
      position: wh.position,
      startDate: wh.startDate.split('T')[0],
      endDate: wh.endDate ? wh.endDate.split('T')[0] : '',
      responsibilities: wh.responsibilities || '',
      reasonForLeaving: wh.reasonForLeaving || '',
    });
    setShowWorkHistoryModal(true);
  };

  const handleDeleteWorkHistory = (workHistoryId: string) => {
    if (confirm('Are you sure you want to delete this work history entry?')) {
      deleteWorkHistoryMutation.mutate(workHistoryId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your employment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">My Employment Profile</h1>
        {currentEmployment && (
          <SubmissionStatusBadge status={currentEmployment.submissionStatus} />
        )}
      </div>

      {/* Submit Button */}
      {canSubmit && (
        <div className="bg-brand-50 border-l-4 border-brand-500 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-brand-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Ready to Submit
              </h3>
              <p className="text-sm sm:text-base text-brand-800 mb-3">
                Your employment data is complete. Submit it for HR review to activate your account features.
              </p>
              <ul className="text-xs sm:text-sm text-brand-700 space-y-1 mb-4 lg:mb-0">
                <li>✓ Employment details filled</li>
                <li>✓ {guarantors.length} guarantor(s) added</li>
                <li>✓ {nextOfKin.length} next of kin added</li>
              </ul>
            </div>
            <button
              onClick={() => {
                if (confirm('Submit your employment data for HR review? You won\'t be able to edit it until HR reviews it.')) {
                  submitMutation.mutate();
                }
              }}
              disabled={submitMutation.isPending}
              className="btn-primary flex items-center justify-center gap-2 text-sm sm:text-base w-full lg:w-auto"
            >
              <Send className="w-4 h-4" />
              {submitMutation.isPending ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </div>
      )}

      {/* Pending Review Message */}
      {isPending && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">
                Submission Under Review
              </h3>
              <p className="text-sm sm:text-base text-blue-800 break-words">
                Your employment data has been submitted and is awaiting HR review. You will be notified once the review is complete.
              </p>
              {currentEmployment.submittedAt && (
                <p className="text-xs sm:text-sm text-blue-700 mt-2">
                  Submitted on {formatDate(currentEmployment.submittedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HR Feedback */}
      {currentEmployment?.reviewNotes && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-yellow-900 mb-2">
                HR Feedback
              </h3>
              <p className="text-sm sm:text-base text-yellow-800 whitespace-pre-wrap break-words">{currentEmployment.reviewNotes}</p>
              {currentEmployment.reviewedAt && (
                <p className="text-xs sm:text-sm text-yellow-700 mt-2">
                  Reviewed on {formatDate(currentEmployment.reviewedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Employment Record */}
      {!currentEmployment && !isLoading && (
        <div className="bg-brand-50 border-l-4 border-brand-500 p-6 rounded-lg mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <AlertCircle className="w-6 h-6 text-brand-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-brand-900 mb-2">
                  Create Your Employment Record
                </h2>
                <p className="text-brand-800 mb-4">
                  You need to create your employment record to access:
                </p>
                <ul className="list-disc list-inside text-brand-800 mb-4 space-y-1">
                  <li>Staff loan applications</li>
                  <li>Leave management</li>
                  <li>Salary and benefits information</li>
                </ul>
                <p className="text-sm text-brand-700">
                  Click the button to get started. HR will review and approve your submission.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateEmploymentModal(true)}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Create Employment Record
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      {currentEmployment && (
        <div className="bg-white border rounded-lg">
          <div className="border-b overflow-x-auto">
            <div className="flex min-w-max sm:min-w-0">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 sm:px-6 py-2 sm:py-3 font-medium flex items-center gap-2 text-xs sm:text-base whitespace-nowrap ${
                  activeTab === 'details'
                    ? 'border-b-2 border-brand-500 text-brand-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                Employment Details
              </button>
              <button
                onClick={() => setActiveTab('guarantors')}
                className={`px-4 sm:px-6 py-2 sm:py-3 font-medium flex items-center gap-2 text-xs sm:text-base whitespace-nowrap ${
                  activeTab === 'guarantors'
                    ? 'border-b-2 border-brand-500 text-brand-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                My Guarantors ({guarantors.length})
              </button>
              <button
                onClick={() => setActiveTab('next-of-kin')}
                className={`px-4 sm:px-6 py-2 sm:py-3 font-medium flex items-center gap-2 text-xs sm:text-base whitespace-nowrap ${
                  activeTab === 'next-of-kin'
                    ? 'border-b-2 border-brand-500 text-brand-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UsersIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                Next of Kin ({nextOfKin.length})
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Employment Details Tab */}
            {activeTab === 'details' && (
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Employment Information</h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">This information is managed by HR. Contact HR to update.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Job Title</p>
                    <p className="font-semibold text-sm sm:text-base break-words">{currentEmployment.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Department</p>
                    <p className="font-semibold text-sm sm:text-base break-words">{currentEmployment.department?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Branch</p>
                    <p className="font-semibold text-sm sm:text-base break-words">{currentEmployment.branch?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Contract Type</p>
                    <p className="font-semibold text-sm sm:text-base">{currentEmployment.contractType}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Hire Date</p>
                    <p className="font-semibold text-sm sm:text-base">{formatDate(currentEmployment.hireDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Monthly Salary</p>
                    <p className="font-semibold text-brand-600 text-base sm:text-lg">
                      {currentEmployment.salary
                        ? `₦${Number(currentEmployment.salary).toLocaleString()}`
                        : 'Not set'}
                    </p>
                  </div>
                </div>

                {/* Staff Loan Eligibility */}
                {currentEmployment.salary && (
                  <div className="p-3 sm:p-4 bg-brand-50 border border-brand-200 rounded-lg mb-4 sm:mb-0">
                    <h3 className="font-semibold text-brand-900 mb-3 text-sm sm:text-base">Your Staff Loan Eligibility</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-brand-700">Max Monthly Deduction (25%)</p>
                        <p className="font-bold text-brand-900 text-sm sm:text-base">
                          ₦{(Number(currentEmployment.salary) * 0.25).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-brand-700">Max Loan Amount (25% × 5 months)</p>
                        <p className="font-bold text-brand-900 text-sm sm:text-base">
                          ₦{(Number(currentEmployment.salary) * 0.25 * 5).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-brand-700">Months Employed</p>
                        <p className="font-bold text-brand-900 text-sm sm:text-base">
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

                {/* Work History - Previous Jobs from OTHER Companies */}
                <div className="mt-4 sm:mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-semibold">Previous Work Experience</h3>
                    <button
                      onClick={() => {
                        setEditingWorkHistory(null);
                        resetWorkHistoryForm();
                        setShowWorkHistoryModal(true);
                      }}
                      disabled={!isEditable || workHistory.length >= 2}
                      className="btn-sm btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                      title={workHistory.length >= 2 ? 'Maximum 2 entries allowed' : 'Add work history'}
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      Add Work History {workHistory.length >= 2 && '(Max Reached)'}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                    Add your last 2 jobs from previous companies (max 2 entries)
                  </p>
                  
                  {workHistory.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-4 sm:p-6 text-center bg-gray-50">
                      <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm sm:text-base text-gray-600">No work history added yet</p>
                      <p className="text-xs sm:text-sm text-gray-500">Add your previous employment from other companies</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {workHistory.map((wh: EmployeeWorkHistory) => (
                        <div key={wh.id} className="border rounded-lg p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-base sm:text-lg break-words">{wh.position}</h4>
                              <p className="text-brand-600 font-medium text-sm sm:text-base break-words">{wh.companyName}</p>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleEditWorkHistory(wh)}
                                disabled={!isEditable}
                                className="text-brand-600 hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed p-1"
                                title={!isEditable ? 'Data is locked' : 'Edit work history'}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteWorkHistory(wh.id)}
                                disabled={!isEditable}
                                className="text-red-600 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed p-1"
                                title={!isEditable ? 'Data is locked' : 'Delete work history'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm mb-2 sm:mb-3">
                            <div>
                              <p className="text-gray-500">Start Date</p>
                              <p className="font-medium break-words">{formatDate(wh.startDate)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">End Date</p>
                              <p className="font-medium break-words">
                                {wh.endDate ? formatDate(wh.endDate) : 'Present'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Duration</p>
                              <p className="font-medium">
                                {Math.round(
                                  (new Date(wh.endDate || new Date()).getTime() - new Date(wh.startDate).getTime()) /
                                    (1000 * 60 * 60 * 24 * 30)
                                )}{' '}
                                months
                              </p>
                            </div>
                          </div>
                          {wh.responsibilities && (
                            <div className="text-xs sm:text-sm mb-2">
                              <p className="text-gray-500 mb-1">Key Responsibilities:</p>
                              <p className="text-gray-700 break-words">{wh.responsibilities}</p>
                            </div>
                          )}
                          {wh.reasonForLeaving && (
                            <div className="text-sm">
                              <p className="text-gray-500 mb-1">Reason for Leaving:</p>
                              <p className="text-gray-700">{wh.reasonForLeaving}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Guarantors Tab */}
            {activeTab === 'guarantors' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">My Guarantors</h2>
                    <p className="text-sm text-gray-500 mt-1">Add professional references who can vouch for you</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingGuarantor(null);
                      resetGuarantorForm();
                      setShowGuarantorModal(true);
                    }}
                    disabled={!isEditable}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Add Guarantor
                  </button>
                </div>

                {!isEditable && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> Your data is currently locked. Contact HR if you need to make changes.
                    </p>
                  </div>
                )}

                {guarantors.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No guarantors added yet</p>
                    <p className="text-sm text-gray-500 mt-1">Add at least one guarantor</p>
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
                            disabled={!isEditable}
                            className="text-brand-600 hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={!isEditable ? 'Data is locked' : 'Edit guarantor'}
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
                  <div>
                    <h2 className="text-xl font-semibold">Next of Kin</h2>
                    <p className="text-sm text-gray-500 mt-1">Emergency contacts and family members</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingNextOfKin(null);
                      resetNextOfKinForm();
                      setShowNextOfKinModal(true);
                    }}
                    disabled={!isEditable}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Add Next of Kin
                  </button>
                </div>

                {!isEditable && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> Your data is currently locked. Contact HR if you need to make changes.
                    </p>
                  </div>
                )}

                {nextOfKin.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                    <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No next of kin added yet</p>
                    <p className="text-sm text-gray-500 mt-1">Add at least one emergency contact</p>
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
                            disabled={!isEditable}
                            className="text-brand-600 hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={!isEditable ? 'Data is locked' : 'Edit next of kin'}
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

      {/* Guarantor Modal - Same as EmployeeDetailsPage */}
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

      {/* Next of Kin Modal - Same as EmployeeDetailsPage */}
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
                  <label className="block text-sm font-medium text-gray-500 mb-2">
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

      {/* Create Employment Modal */}
      {showCreateEmploymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Create Your Employment Record</h3>
              <p className="text-sm text-gray-600 mt-1">
                Fill in your employment details. HR will review and approve your submission.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!employmentData.hireDate || !employmentData.jobTitle || !employmentData.departmentId || !employmentData.branchId) {
                  alert('Please fill in all required fields');
                  return;
                }
                createMyEmploymentMutation.mutate();
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hire Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={employmentData.hireDate}
                    onChange={(e) => setEmploymentData({ ...employmentData, hireDate: e.target.value })}
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
                    value={employmentData.jobTitle}
                    onChange={(e) => setEmploymentData({ ...employmentData, jobTitle: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Loan Officer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={employmentData.departmentId}
                    onChange={(e) => setEmploymentData({ ...employmentData, departmentId: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept: any) => (
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
                    value={employmentData.branchId}
                    onChange={(e) => setEmploymentData({ ...employmentData, branchId: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch: any) => (
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
                    value={employmentData.contractType}
                    onChange={(e) => setEmploymentData({ ...employmentData, contractType: e.target.value as any })}
                    className="input-field"
                    required
                  >
                    <option value="PERMANENT">Permanent</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="TEMPORARY">Temporary</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> After creating your employment record, you'll need to add guarantors and next of kin, 
                  then submit for HR review. Your salary will be set by HR.
                </p>
              </div>

              <div className="flex items-center gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateEmploymentModal(false);
                    setEmploymentData({
                      hireDate: '',
                      jobTitle: '',
                      departmentId: '',
                      branchId: '',
                      contractType: 'PERMANENT',
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMyEmploymentMutation.isPending}
                  className="btn-primary"
                >
                  {createMyEmploymentMutation.isPending ? 'Creating...' : 'Create Employment Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Work History Modal */}
      {showWorkHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingWorkHistory ? 'Edit Work History' : 'Add Work History'}
              </h2>
              <form onSubmit={handleWorkHistorySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={workHistoryData.companyName}
                      onChange={(e) => setWorkHistoryData({ ...workHistoryData, companyName: e.target.value })}
                      className="input-field"
                      placeholder="Previous company name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position/Job Title *
                    </label>
                    <input
                      type="text"
                      value={workHistoryData.position}
                      onChange={(e) => setWorkHistoryData({ ...workHistoryData, position: e.target.value })}
                      className="input-field"
                      placeholder="Your job title"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={workHistoryData.startDate}
                      onChange={(e) => setWorkHistoryData({ ...workHistoryData, startDate: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={workHistoryData.endDate || ''}
                      onChange={(e) => setWorkHistoryData({ ...workHistoryData, endDate: e.target.value })}
                      className="input-field"
                      placeholder="Leave empty if current"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty if still working there</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Responsibilities
                  </label>
                  <textarea
                    value={workHistoryData.responsibilities || ''}
                    onChange={(e) => setWorkHistoryData({ ...workHistoryData, responsibilities: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Brief description of your key responsibilities..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Leaving
                  </label>
                  <input
                    type="text"
                    value={workHistoryData.reasonForLeaving || ''}
                    onChange={(e) => setWorkHistoryData({ ...workHistoryData, reasonForLeaving: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Career advancement, relocation, etc."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Add your employment history from OTHER companies (not this organization). 
                    Maximum 2 entries allowed.
                  </p>
                </div>

                <div className="flex items-center gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWorkHistoryModal(false);
                      setEditingWorkHistory(null);
                      resetWorkHistoryForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createWorkHistoryMutation.isPending || updateWorkHistoryMutation.isPending}
                    className="btn-primary"
                  >
                    {editingWorkHistory 
                      ? (updateWorkHistoryMutation.isPending ? 'Updating...' : 'Update Work History')
                      : (createWorkHistoryMutation.isPending ? 'Adding...' : 'Add Work History')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
