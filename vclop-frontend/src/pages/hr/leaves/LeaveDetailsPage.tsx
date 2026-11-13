import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, FileText, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { leavesService, type LeaveStatus } from '@/services/leaves.service';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

const STATUS_CONFIG: Record<LeaveStatus, { label: string; variant: 'gray' | 'yellow' | 'blue' | 'green' | 'red' }> = {
  DRAFT: { label: 'Draft', variant: 'gray' },
  PENDING_APPROVAL: { label: 'Pending', variant: 'yellow' },
  APPROVED: { label: 'Approved', variant: 'blue' },
  REJECTED: { label: 'Rejected', variant: 'red' },
  ACTIVE: { label: 'Active', variant: 'green' },
  COMPLETED: { label: 'Completed', variant: 'gray' },
  CANCELLED: { label: 'Cancelled', variant: 'red' },
};

export function LeaveDetailsPage() {
  const { leaveId } = useParams<{ leaveId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: application, isLoading } = useQuery({
    queryKey: ['leave-application', leaveId],
    queryFn: () => leavesService.getApplicationById(leaveId!),
    enabled: !!leaveId,
  });

  const { data: approvalHistory } = useQuery({
    queryKey: ['leave-approval-history', leaveId],
    queryFn: () => leavesService.getApprovalHistory(leaveId!),
    enabled: !!leaveId,
  });

  const cancelMutation = useMutation({
    mutationFn: () => leavesService.cancelApplication(leaveId!, { reason: cancelReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-application', leaveId] });
      queryClient.invalidateQueries({ queryKey: ['my-leave-applications'] });
      toast.success('Leave application cancelled successfully');
      setShowCancelModal(false);
      navigate('/hr/leaves/my-applications');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel application');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leave details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-gray-600">Leave application not found</p>
          <button onClick={() => navigate('/hr/leaves/my-applications')} className="btn-primary mt-4">
            Back to My Leaves
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[application.status];
  const canCancel = ['PENDING_APPROVAL', 'APPROVED'].includes(application.status);

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <button onClick={() => navigate('/hr/leaves/my-applications')} className="btn-ghost mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to My Leaves
      </button>

      {/* Header */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Leave Application Details</h1>
            <p className="text-sm text-gray-500 font-mono">{application.applicationNumber}</p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">Leave Type</p>
            <p className="text-lg font-semibold">{application.leaveType.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Duration</p>
            <p className="text-lg font-semibold">{application.businessDays} days</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Start Date</p>
            <p className="text-lg font-semibold">{formatDate(application.startDate)}</p>
            <p className="text-xs text-gray-500">{application.startDayType.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">End Date</p>
            <p className="text-lg font-semibold">{formatDate(application.endDate)}</p>
            <p className="text-xs text-gray-500">{application.endDayType.replace('_', ' ')}</p>
          </div>
        </div>

        {canCancel && (
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn-danger"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Application
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Leave Information
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Reason</p>
              <p className="font-medium mt-1">{application.reason}</p>
            </div>
            <div>
              <p className="text-gray-500">Submitted On</p>
              <p className="font-medium">{application.submittedAt ? formatDate(application.submittedAt) : 'Not submitted'}</p>
            </div>
            {application.approvedAt && (
              <div>
                <p className="text-gray-500">Approved On</p>
                <p className="font-medium">{formatDate(application.approvedAt)}</p>
              </div>
            )}
            {application.cancelledAt && (
              <div>
                <p className="text-gray-500">Cancelled On</p>
                <p className="font-medium">{formatDate(application.cancelledAt)}</p>
                {application.cancelReason && (
                  <p className="text-red-600 mt-1">Reason: {application.cancelReason}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Balance Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Primary Year</span>
              <span className="font-semibold">{application.primaryEntitlementYear}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Days from Primary</span>
              <span className="font-semibold">{application.daysFromPrimary}</span>
            </div>
            {application.secondaryEntitlementYear && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Secondary Year</span>
                  <span className="font-semibold">{application.secondaryEntitlementYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Days from Secondary</span>
                  <span className="font-semibold">{application.daysFromSecondary}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Approval Timeline */}
      {approvalHistory && approvalHistory.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Approval Timeline
          </h3>
          <div className="space-y-4">
            {approvalHistory.map((approval, index) => (
              <div key={approval.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    approval.decision === 'APPROVED' ? 'bg-green-100 text-green-600' :
                    approval.decision === 'REJECTED' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {approval.decision === 'APPROVED' ? <CheckCircle className="w-5 h-5" /> :
                     approval.decision === 'REJECTED' ? <XCircle className="w-5 h-5" /> :
                     <Clock className="w-5 h-5" />}
                  </div>
                  {index < approvalHistory.length - 1 && (
                    <div className="w-0.5 h-12 bg-gray-200 my-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {approval.approver.firstName} {approval.approver.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{approval.approver.email}</p>
                      <p className="text-sm text-gray-500">Level {approval.level} Approver</p>
                    </div>
                    {approval.decision && (
                      <Badge variant={approval.decision === 'APPROVED' ? 'green' : 'red'}>
                        {approval.decision}
                      </Badge>
                    )}
                  </div>
                  {approval.comments && (
                    <p className="text-sm text-gray-600 mt-2 italic">"{approval.comments}"</p>
                  )}
                  {approval.decidedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(approval.decidedAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Cancel Leave Application</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for cancelling this leave application.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="input min-h-[100px] mb-4"
              placeholder="Reason for cancellation..."
              required
            />
            <div className="flex gap-3">
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={!cancelReason || cancelMutation.isPending}
                className="btn-danger flex-1"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-ghost flex-1"
              >
                Keep Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
