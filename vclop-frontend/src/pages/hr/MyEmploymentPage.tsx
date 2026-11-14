import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Shield, Users as UsersIcon, Plus, Edit, AlertCircle } from 'lucide-react';
import { 
  employmentService, 
  type CreateGuarantorDto,
  type CreateNextOfKinDto,
  type EmployeeGuarantor,
  type EmployeeNextOfKin
} from '@/services/employment.service';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/axios';
import { formatDate } from '@/lib/utils';

type TabType = 'details' | 'guarantors' | 'next-of-kin';

export function MyEmploymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [showGuarantorModal, setShowGuarantorModal] = useState(false);
  const [showNextOfKinModal, setShowNextOfKinModal] = useState(false);
  const [editingGuarantor, setEditingGuarantor] = useState<EmployeeGuarantor | null>(null);
  const [editingNextOfKin, setEditingNextOfKin] = useState<EmployeeNextOfKin | null>(null);

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
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">My Employment Profile</h1>

      {/* No Employment Record */}
      {!currentEmployment && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg mb-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">
                No Employment Record Found
              </h2>
              <p className="text-yellow-800 mb-4">
                You don't have an active employment record in the system. This is required to:
              </p>
              <ul className="list-disc list-inside text-yellow-800 mb-4 space-y-1">
                <li>Apply for staff loans</li>
                <li>Submit leave applications</li>
                <li>View salary and benefits information</li>
              </ul>
              <p className="text-yellow-800 font-medium">
                📞 Please contact HR to have your employment record created.
              </p>
            </div>
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
                Employment Details
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
                My Guarantors ({guarantors.length})
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
            {/* Employment Details Tab */}
            {activeTab === 'details' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Employment Information</h2>
                <p className="text-sm text-gray-500 mb-6">This information is managed by HR. Contact HR to update.</p>

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
                    <h3 className="font-semibold text-brand-900 mb-3">Your Staff Loan Eligibility</h3>
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
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Next of Kin
                  </button>
                </div>

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
    </div>
  );
}
