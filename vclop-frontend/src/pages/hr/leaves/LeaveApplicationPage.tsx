import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, FileText, Send, Info, CheckCircle2, Clock, AlertCircle, X, Users } from 'lucide-react';
import { leavesService, type DayType } from '@/services/leaves.service';
import { usersService } from '@/services/users.service';
import { useAuthStore } from '@/stores/auth.store';

export function LeaveApplicationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    startDayType: 'FULL_DAY' as DayType,
    endDayType: 'FULL_DAY' as DayType,
    reason: '',
    relieverId: '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate resumption date and duration
  const getResumptionDate = () => {
    if (!formData.endDate) return null;
    const end = new Date(formData.endDate);
    const resumption = new Date(end);
    resumption.setDate(resumption.getDate() + 1);
    return resumption;
  };

  const calculateDuration = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const resumptionDate = getResumptionDate();
  const duration = calculateDuration();

  const { data: leaveTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => leavesService.getLeaveTypes(),
  });

  const { data: balances } = useQuery({
    queryKey: ['my-leave-balances', currentYear],
    queryFn: () => leavesService.getMyBalance(currentYear),
    enabled: !!formData.leaveTypeId,
  });

  // Fetch users in the same department for reliever selection
  const { data: departmentUsers } = useQuery({
    queryKey: ['department-users', user?.departmentId],
    queryFn: () => usersService.getUsersByDepartment(user!.departmentId!),
    enabled: !!user?.departmentId,
  });

  const createMutation = useMutation({
    mutationFn: async (draft: boolean) => {
      const application = await leavesService.createApplication(formData);
      if (!draft) {
        await leavesService.submitApplication(application.id);
      }
      return application;
    },
    onSuccess: (_application, draft) => {
      queryClient.invalidateQueries({ queryKey: ['my-leave-applications'] });
      queryClient.invalidateQueries({ queryKey: ['my-leave-balances'] });
      
      setErrorMessage(null);
      alert(draft ? 'Leave application saved as draft' : 'Leave application submitted successfully');
      navigate('/hr/leaves/my-applications');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create application';
      setErrorMessage(message);
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const selectedType = leaveTypes?.find(t => t.id === formData.leaveTypeId);
  const balanceArray = Array.isArray(balances) ? balances : [];
  const selectedBalance = balanceArray.find(b => b.leaveType.id === formData.leaveTypeId);

  const handleSubmit = (e: React.FormEvent, draft: boolean = false) => {
    e.preventDefault();
    
    // Clear previous error
    setErrorMessage(null);
    
    if (!formData.leaveTypeId || !formData.startDate || !formData.endDate || !formData.reason) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    createMutation.mutate(draft);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <button 
          onClick={() => navigate('/hr/leaves/my-applications')} 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to My Leaves</span>
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-6 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Apply for Leave</h1>
                <p className="text-brand-50 mt-1">Submit your leave request for approval</p>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mx-8 mt-6">
              <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 shadow-sm animate-shake">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-900">Unable to Submit Leave Application</h3>
                    <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                    {errorMessage.includes('balance') && (
                      <p className="text-xs text-red-600 mt-2 italic">
                        💡 Tip: Check your available balance above or contact HR if you believe this is an error.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    aria-label="Dismiss error"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="mx-8 -mb-3 translate-y-[-1rem]">
            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4 shadow-sm">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-medium">Quick Tip</p>
                  <p className="text-sm text-blue-700 mt-1">
                    You can apply for past dates if you're already on leave. Your resumption date will be automatically calculated.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="p-8 space-y-6">
            {/* Leave Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.leaveTypeId}
                onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                required
                disabled={loadingTypes}
              >
                <option value="">
                  {loadingTypes ? 'Loading leave types...' : 'Select a leave type'}
                </option>
                {leaveTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.code}) - {type.defaultDaysPerYear} days/year
                  </option>
                ))}
              </select>
              {selectedType && (
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{selectedType.description}</p>
                </div>
              )}
            </div>

            {/* Balance Display */}
            {selectedBalance && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Your Leave Balance
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Total Available</p>
                    <p className="text-3xl font-bold text-blue-900">{selectedBalance.totalAvailable}</p>
                    <p className="text-xs text-gray-500 mt-1">days</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Used</p>
                    <p className="text-3xl font-bold text-orange-600">{selectedBalance.used}</p>
                    <p className="text-xs text-gray-500 mt-1">days</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">{selectedBalance.pending}</p>
                    <p className="text-xs text-gray-500 mt-1">days</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Remaining</p>
                    <p className="text-3xl font-bold text-green-600">{selectedBalance.remaining}</p>
                    <p className="text-xs text-gray-500 mt-1">days</p>
                  </div>
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  required
                />
                <select
                  value={formData.startDayType}
                  onChange={(e) => setFormData({ ...formData, startDayType: e.target.value as DayType })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                >
                  <option value="FULL_DAY">📅 Full Day</option>
                  <option value="FIRST_HALF">🌅 First Half (Morning)</option>
                  <option value="SECOND_HALF">🌆 Second Half (Afternoon)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  min={formData.startDate}
                  required
                />
                <select
                  value={formData.endDayType}
                  onChange={(e) => setFormData({ ...formData, endDayType: e.target.value as DayType })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                >
                  <option value="FULL_DAY">📅 Full Day</option>
                  <option value="FIRST_HALF">🌅 First Half (Morning)</option>
                  <option value="SECOND_HALF">🌆 Second Half (Afternoon)</option>
                </select>
              </div>
            </div>

            {/* Duration & Resumption Info */}
            {duration > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {/* Duration Card */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 uppercase tracking-wide font-medium">Leave Duration</p>
                      <p className="text-2xl font-bold text-purple-900 mt-0.5">
                        {duration} {duration === 1 ? 'Day' : 'Days'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resumption Date Card */}
                {resumptionDate && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-green-600 uppercase tracking-wide font-medium">Resumption Date</p>
                        <p className="text-lg font-bold text-green-900 mt-0.5">
                          {resumptionDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reliever Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Select Reliever (Person covering your duties)
              </label>
              <select
                value={formData.relieverId}
                onChange={(e) => setFormData({ ...formData, relieverId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              >
                <option value="">Select a colleague from your department (optional)</option>
                {departmentUsers?.filter(u => u.id !== user?.id).map((colleague) => (
                  <option key={colleague.id} value={colleague.id}>
                    {colleague.firstName} {colleague.lastName} - {colleague.jobTitle || 'Staff'}
                  </option>
                ))}
              </select>
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Users className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Optional: Select a colleague to cover your responsibilities. If none available, HR will assign coverage.
                </p>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Reason for Leave <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                placeholder="Please provide a clear and concise reason for your leave request..."
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Your reason helps managers process your request faster
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                <Send className="w-5 h-5" />
                {createMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={createMutation.isPending}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-5 h-5" />
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => navigate('/hr/leaves/my-applications')}
                className="sm:flex-initial px-6 py-3 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact HR at <a href="mailto:hr@company.com" className="text-brand-600 hover:text-brand-700 font-medium">hr@company.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
