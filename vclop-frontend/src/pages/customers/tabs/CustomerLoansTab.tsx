import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Landmark, Plus, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { loansService } from '@/services/loans.service';
import { workflowsService } from '@/services/workflows.service';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate } from '@/lib/utils';
import type { LoanApplicationStatus } from '@/types/domain.types';

const STATUS_VARIANT: Record<LoanApplicationStatus, 'green' | 'red' | 'yellow' | 'blue' | 'gray'> = {
  DRAFT: 'gray', SUBMITTED: 'yellow', COMPLIANCE_REVIEW: 'yellow', NEEDS_ATTENTION: 'red', AWAITING_INFORMATION: 'yellow', INTERNAL_CONTROL_REVIEW: 'yellow', ACCOUNTING_REVIEW: 'blue', APPROVED: 'blue', DISBURSED: 'green', REJECTED: 'red', RETURNED: 'yellow', ESCALATED: 'red', CANCELLED: 'gray',
};

export function CustomerLoansTab({ customerId }: { customerId: string }) {
  const { hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['loans', 'by-customer', customerId],
    queryFn: () => loansService.list({ customerId, limit: 50 }),
  });

  const isCompliance = hasPermission('loan_applications:compliance_review');
  const isIC = hasPermission('loan_applications:internal_control_approve');
  const canReview = isCompliance || isIC;

  if (isLoading) return <PageLoader />;

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Loan Applications</h3>
        {hasPermission('loan_applications:create') && (
          <button onClick={() => navigate(`/loans/new?customerId=${customerId}`)} className="btn-secondary btn-sm gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Apply for Loan
          </button>
        )}
      </div>
      {!data?.data.length ? (
        <div className="card-body">
          <EmptyState icon={Landmark} title="No loan applications yet" description="Start one from the button above." />
        </div>
      ) : (
        <div className="card-body space-y-2">
          {data.data.map((loan) => {
            const showReviewControls = canReview && (
              (isCompliance && loan.status === 'COMPLIANCE_REVIEW') ||
              (isIC && loan.status === 'INTERNAL_CONTROL_REVIEW')
            );
            const isExpanded = expandedLoan === loan.id;

            return (
              <div key={loan.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => {
                    if (showReviewControls) {
                      setExpandedLoan(isExpanded ? null : loan.id);
                    } else {
                      navigate(`/loans/${loan.id}`);
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 font-mono">{loan.applicationNumber}</p>
                    <p className="text-xs text-gray-500">{loan.loanProduct?.name} · ₦{Number(loan.amount).toLocaleString()} · {formatDate(loan.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[loan.status]}>{loan.status}</Badge>
                    {showReviewControls && (
                      isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {showReviewControls && isExpanded && (
                  <LoanReviewControls
                    loanId={loan.id}
                    isCompliance={isCompliance}
                    isIC={isIC}
                    onSuccess={() => setExpandedLoan(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LoanReviewControls({
  loanId,
  isCompliance,
  isIC,
  onSuccess,
}: {
  loanId: string;
  isCompliance: boolean;
  isIC: boolean;
  onSuccess: () => void;
}) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const workflowMutation = useMutation({
    mutationFn: (action: 'APPROVE' | 'REJECT' | 'RETURN') =>
      workflowsService.transition('LOAN_APPLICATION', loanId, {
        action,
        notes,
        reason: action === 'REJECT' ? rejectReason : undefined,
      }),
    onSuccess: () => {
      toast.success('Application reviewed successfully');
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['loan', loanId] });
      onSuccess();
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Review failed'),
  });

  if (showReject) {
    return (
      <div className="p-4 bg-red-50 border-t border-red-100 space-y-3">
        <div>
          <label className="form-label text-xs">Rejection Reason *</label>
          <textarea
            rows={2}
            className="form-input text-xs"
            placeholder="Explain why this application is being rejected..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
        <div>
          <label className="form-label text-xs">Additional Notes</label>
          <textarea
            rows={2}
            className="form-input text-xs"
            placeholder="Optional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => workflowMutation.mutate('REJECT')}
            disabled={!rejectReason.trim() || workflowMutation.isPending}
            className="btn-danger btn-sm gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" /> Confirm Rejection
          </button>
          <button
            onClick={() => setShowReject(false)}
            className="btn-secondary btn-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border-t border-blue-100 space-y-3">
      <div>
        <label className="form-label text-xs">
          {isCompliance && 'Compliance Review Notes'}
          {isIC && 'Internal Control Notes'}
        </label>
        <textarea
          rows={2}
          className="form-input text-xs"
          placeholder="Add your review notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => workflowMutation.mutate('APPROVE')}
          disabled={workflowMutation.isPending}
          className="btn-primary btn-sm gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isCompliance && 'Approve to IC'}
          {isIC && 'Approve'}
        </button>
        <button
          onClick={() => setShowReject(true)}
          className="btn-secondary btn-sm gap-1.5"
        >
          <XCircle className="w-3.5 h-3.5" /> Reject / Return
        </button>
      </div>
      <p className="text-xs text-gray-500">
        💡 You can also click the application number to open the full detail page for comprehensive review.
      </p>
    </div>
  );
}
