import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, CheckCircle2, XCircle, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate } from '@/lib/utils';
import { transportService, type TransportRequestStatus } from '@/services/transport.service';

const STATUS_VARIANT: Record<TransportRequestStatus, 'green' | 'red' | 'yellow' | 'blue' | 'gray'> = {
  PENDING: 'yellow',
  OPERATIONS_REVIEW: 'yellow',
  APPROVED: 'blue',
  REJECTED: 'red',
  PAID: 'green',
  CANCELLED: 'gray',
};

const STATUS_OPTS: Array<{ value: TransportRequestStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'OPERATIONS_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PAID', label: 'Paid' },
];

// ── Review slide-over ────────────────────────────────────────────────────────

interface ReviewPanelProps {
  requestId: string;
  onClose: () => void;
}

function ReviewPanel({ requestId, onClose }: ReviewPanelProps) {
  const [approved, setApproved] = useState<boolean | null>(null);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [reason, setReason] = useState('');
  const qc = useQueryClient();

  const reviewMutation = useMutation({
    mutationFn: () =>
      transportService.review(requestId, {
        approved: approved!,
        approvedAmount: approvedAmount ? Number(approvedAmount) : undefined,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      toast.success(approved ? 'Transport request approved' : 'Transport request rejected');
      qc.invalidateQueries({ queryKey: ['transport-requests'] });
      onClose();
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Action failed'),
  });

  return (
    <div className="panel-overlay">
      <div className="panel-backdrop" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-sm bg-white h-full shadow-2xl flex flex-col">
        <div className="panel-header flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Review Transport Request</h2>
          <button onClick={onClose} className="btn-ghost btn-icon w-8 h-8 text-gray-400">✕</button>
        </div>

        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setApproved(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${approved === true ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              Approve
            </button>
            <button
              onClick={() => setApproved(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${approved === false ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              Reject
            </button>
          </div>

          {approved && (
            <div>
              <label className="form-label">Approved Amount (₦)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Leave blank to match suggested amount"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="form-label">{approved === false ? 'Rejection Reason (required)' : 'Notes (optional)'}</label>
            <textarea
              className="form-input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={approved === false ? 'Why is this request being rejected?' : 'Any additional notes…'}
            />
          </div>
        </div>

        <div className="panel-footer">
          <button
            onClick={() => reviewMutation.mutate()}
            disabled={approved === null || (approved === false && !reason) || reviewMutation.isPending}
            className="btn-primary w-full disabled:opacity-50"
          >
            {reviewMutation.isPending ? 'Saving…' : 'Confirm Decision'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function TransportPage() {
  const [statusFilter, setStatusFilter] = useState<TransportRequestStatus | ''>('');
  const [search, setSearch] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const { hasPermission } = useAuthStore();
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['transport-requests', statusFilter],
    queryFn: () => transportService.list(statusFilter || undefined),
    placeholderData: (prev) => prev,
  });

  const payMutation = useMutation({
    mutationFn: transportService.markPaid,
    onSuccess: () => {
      toast.success('Transport request marked as paid');
      qc.invalidateQueries({ queryKey: ['transport-requests'] });
    },
    onError: () => toast.error('Failed to mark as paid'),
  });

  // IC officers + admin can review; accounting head + admin can pay
  const canReview = hasPermission('transport:approve') || hasPermission('system:admin');
  const canPay    = hasPermission('loan_applications:disburse_head') || hasPermission('system:admin');

  return (
    <>
      {reviewingId && (
        <ReviewPanel requestId={reviewingId} onClose={() => setReviewingId(null)} />
      )}

      <ModulePage
        title="Transport Requests"
        subtitle="Field officer transport allowance requests and approvals"
        icon={Car}
        search={search}
        onSearchChange={setSearch}
        actions={[]}
        columns={[
          { key: 'ref',       label: 'Application #' },
          { key: 'officer',   label: 'Requested By' },
          { key: 'customer',  label: 'Customer' },
          { key: 'purpose',   label: 'Purpose' },
          { key: 'count',     label: '# Customers', width: '110px' },
          { key: 'amount',    label: 'Amount',       width: '130px' },
          { key: 'status',    label: 'Status',       width: '120px' },
          { key: 'date',      label: 'Date',         width: '110px' },
          { key: 'action',    label: '',             width: '170px' },
        ]}
        isLoading={isLoading}
        isEmpty={!isLoading && requests.length === 0}
        emptyIcon={Car}
        emptyTitle="No transport requests"
        emptyDescription="Transport requests submitted by field officers will appear here."
        filters={
          <select
            className="form-input h-9 text-sm w-44"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TransportRequestStatus | '')}
          >
            {STATUS_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        }
        rows={
          <>
            {requests.map((req) => (
              <tr key={req.id}>
                <td className="font-mono text-xs text-brand-600 font-semibold">
                  {req.loanApplication?.applicationNumber ?? '—'}
                </td>
                <td className="text-sm text-gray-800">
                  {req.requestedBy
                    ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}`
                    : '—'}
                </td>
                <td className="text-sm text-gray-600">
                  {req.loanApplication?.customer
                    ? `${req.loanApplication.customer.firstName} ${req.loanApplication.customer.lastName}`
                    : '—'}
                </td>
                <td className="text-xs text-gray-600 max-w-[200px] truncate" title={req.purpose}>
                  {req.purpose}
                  {req.location && <span className="block text-gray-400">{req.location}</span>}
                </td>
                <td className="text-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-50 text-brand-700 text-xs font-bold">
                    {req.customerCount ?? 1}
                  </span>
                </td>
                <td>
                  <div className="text-sm font-medium text-gray-800">
                    ₦{Number(req.approvedAmount ?? req.suggestedAmount ?? req.estimatedCost ?? 0).toLocaleString()}
                  </div>
                  {req.suggestedAmount && !req.approvedAmount && (
                    <div className="text-xs text-gray-400">suggested</div>
                  )}
                  {req.approvedAmount && (
                    <div className="text-xs text-gray-400">approved</div>
                  )}
                </td>
                <td>
                  <Badge variant={STATUS_VARIANT[req.status]}>{req.status.replace(/_/g, ' ')}</Badge>
                  {req.reason && (
                    <p className="text-xs text-gray-400 mt-0.5 max-w-[120px] truncate" title={req.reason}>
                      {req.reason}
                    </p>
                  )}
                </td>
                <td className="text-xs text-gray-500">{formatDate(req.createdAt)}</td>
                <td className="flex gap-1.5 py-2">
                  {canReview && (req.status === 'PENDING' || req.status === 'OPERATIONS_REVIEW') && (
                    <button
                      onClick={() => setReviewingId(req.id)}
                      className="btn-secondary btn-sm gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Review
                    </button>
                  )}
                  {canPay && req.status === 'APPROVED' && (
                    <button
                      onClick={() => payMutation.mutate(req.id)}
                      disabled={payMutation.isPending}
                      className="btn-primary btn-sm gap-1 disabled:opacity-50"
                    >
                      <Banknote className="w-3.5 h-3.5" /> Pay
                    </button>
                  )}
                  {req.status === 'REJECTED' && (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </td>
              </tr>
            ))}
          </>
        }
      />
    </>
  );
}
