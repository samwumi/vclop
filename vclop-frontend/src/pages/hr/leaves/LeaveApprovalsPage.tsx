import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Calendar, User, MessageSquare } from 'lucide-react';
import { leavesService, type LeaveApproval, type ApprovalDecision } from '@/services/leaves.service';

export function LeaveApprovalsPage() {
  const queryClient = useQueryClient();
  const [selectedApproval, setSelectedApproval] = useState<LeaveApproval | null>(null);
  const [decision, setDecision] = useState<ApprovalDecision | ''>('');
  const [comments, setComments] = useState('');

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['all-pending-leave-approvals'],
    queryFn: () => leavesService.getAllPendingApprovals(),
  });

  console.log('[LeaveApprovalsPage] Raw approvals data:', approvals);
  console.log('[LeaveApprovalsPage] Is loading:', isLoading);

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedApproval || !decision) return;
      return await leavesService.processApproval(selectedApproval.id, {
        decision,
        comments: comments || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-leave-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['leave-applications'] });
      setSelectedApproval(null);
      setDecision('');
      setComments('');
      alert('Leave application processed successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to process approval');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const pendingApprovals = approvals || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leave Approvals</h1>
        <p className="text-gray-600 mt-2">Review and approve leave applications from your team</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approvals</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingApprovals.length}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Approvals List */}
      {pendingApprovals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Approvals</h3>
          <p className="text-gray-600">All leave applications have been reviewed</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingApprovals.map((approval: any) => (
                  <tr key={approval.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <User className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {approval.leaveApplication?.user?.firstName} {approval.leaveApplication?.user?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{approval.leaveApplication?.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {approval.leaveApplication?.leaveType?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {new Date(approval.leaveApplication?.startDate).toLocaleDateString()} - 
                          {new Date(approval.leaveApplication?.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {approval.leaveApplication?.businessDaysRequested} days
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 max-w-xs truncate">
                        {approval.leaveApplication?.reason}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedApproval(approval)}
                        className="text-brand-600 hover:text-brand-700 font-medium text-sm"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Review Leave Application</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Employee</h3>
                <p className="text-lg font-medium text-gray-900">
                  {(selectedApproval as any).leaveApplication?.user?.firstName}{' '}
                  {(selectedApproval as any).leaveApplication?.user?.lastName}
                </p>
                <p className="text-sm text-gray-600">{(selectedApproval as any).leaveApplication?.user?.email}</p>
              </div>

              {/* Leave Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Leave Type</h3>
                  <p className="text-gray-900">{(selectedApproval as any).leaveApplication?.leaveType?.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Duration</h3>
                  <p className="text-gray-900">{(selectedApproval as any).leaveApplication?.businessDaysRequested} days</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Start Date</h3>
                  <p className="text-gray-900">
                    {new Date((selectedApproval as any).leaveApplication?.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">End Date</h3>
                  <p className="text-gray-900">
                    {new Date((selectedApproval as any).leaveApplication?.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Reason</h3>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                  {(selectedApproval as any).leaveApplication?.reason}
                </p>
              </div>

              {/* Decision */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Decision <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setDecision('APPROVE')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      decision === 'APPROVE'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                    <span className="font-medium">Approve</span>
                  </button>
                  <button
                    onClick={() => setDecision('REJECT')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      decision === 'REJECT'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-red-300'
                    }`}
                  >
                    <XCircle className="w-5 h-5 mx-auto mb-1" />
                    <span className="font-medium">Reject</span>
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  placeholder="Add any comments or feedback..."
                  rows={4}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setSelectedApproval(null);
                  setDecision('');
                  setComments('');
                }}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={!decision || approveMutation.isPending}
                className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {approveMutation.isPending ? 'Processing...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
