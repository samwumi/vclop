import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, FileText, Send } from 'lucide-react';
import { leavesService, type DayType } from '@/services/leaves.service';

export function LeaveApplicationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    startDayType: 'FULL_DAY' as DayType,
    endDayType: 'FULL_DAY' as DayType,
    reason: '',
  });

  const { data: leaveTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => leavesService.getLeaveTypes(),
  });

  const { data: balances } = useQuery({
    queryKey: ['my-leave-balances', currentYear],
    queryFn: () => leavesService.getMyBalance(currentYear),
    enabled: !!formData.leaveTypeId,
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
      
      alert(draft ? 'Leave application saved as draft' : 'Leave application submitted successfully');
      navigate('/hr/leaves/my-applications');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create application');
    },
  });

  const selectedType = leaveTypes?.find(t => t.id === formData.leaveTypeId);
  const balanceArray = Array.isArray(balances) ? balances : [];
  const selectedBalance = balanceArray.find(b => b.leaveType.id === formData.leaveTypeId);

  const handleSubmit = (e: React.FormEvent, draft: boolean = false) => {
    e.preventDefault();
    
    if (!formData.leaveTypeId || !formData.startDate || !formData.endDate || !formData.reason) {
      alert('Please fill in all required fields');
      return;
    }

    createMutation.mutate(draft);
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <button onClick={() => navigate('/hr/leaves/my-applications')} className="btn-ghost mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to My Leaves
      </button>

      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-brand-50 rounded-lg">
            <Calendar className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Apply for Leave</h1>
            <p className="text-gray-600">Submit a new leave application</p>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Leave Type */}
          <div>
            <label className="label required">Leave Type</label>
            <select
              value={formData.leaveTypeId}
              onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
              className="input"
              required
              disabled={loadingTypes}
            >
              <option value="">Select leave type</option>
              {leaveTypes?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.code})
                </option>
              ))}
            </select>
            {selectedType && (
              <p className="text-sm text-gray-500 mt-1">{selectedType.description}</p>
            )}
          </div>

          {/* Balance Display */}
          {selectedBalance && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-blue-900 mb-2">Your Balance</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-blue-600">Total</p>
                  <p className="font-bold text-blue-900">{selectedBalance.totalAvailable} days</p>
                </div>
                <div>
                  <p className="text-blue-600">Used</p>
                  <p className="font-bold text-blue-900">{selectedBalance.used} days</p>
                </div>
                <div>
                  <p className="text-blue-600">Pending</p>
                  <p className="font-bold text-blue-900">{selectedBalance.pending} days</p>
                </div>
                <div>
                  <p className="text-blue-600">Remaining</p>
                  <p className="font-bold text-green-600">{selectedBalance.remaining} days</p>
                </div>
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label required">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input"
                required
              />
              <select
                value={formData.startDayType}
                onChange={(e) => setFormData({ ...formData, startDayType: e.target.value as DayType })}
                className="input mt-2"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="FIRST_HALF">First Half</option>
                <option value="SECOND_HALF">Second Half</option>
              </select>
            </div>
            <div>
              <label className="label required">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input"
                min={formData.startDate}
                required
              />
              <select
                value={formData.endDayType}
                onChange={(e) => setFormData({ ...formData, endDayType: e.target.value as DayType })}
                className="input mt-2"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="FIRST_HALF">First Half</option>
                <option value="SECOND_HALF">Second Half</option>
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="label required">Reason for Leave</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="input min-h-[120px]"
              placeholder="Provide a brief reason for your leave request..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Be clear and concise about why you need this leave
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary"
            >
              <Send className="w-4 h-4 mr-2" />
              {createMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={createMutation.isPending}
              className="btn-secondary"
            >
              <FileText className="w-4 h-4 mr-2" />
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => navigate('/hr/leaves/my-applications')}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
