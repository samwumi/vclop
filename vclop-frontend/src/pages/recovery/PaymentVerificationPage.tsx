import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { recoveryService } from '@/services/recovery.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PaymentVerificationPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch all accounts to get pending payments
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['recovery', 'accounts-for-verification'],
    queryFn: () => recoveryService.listAccounts({}),
  });

  // Get all pending payments from all accounts
  const pendingPayments =
    accounts
      ?.flatMap((account) =>
        (account.payments || [])
          .filter((payment) => payment.status === 'PENDING_VERIFICATION')
          .map((payment) => ({
            ...payment,
            account: {
              id: account.id,
              accountNumber: account.accountNumber,
              customerName: account.customerName,
              customerPhone: account.customerPhone,
            },
          })),
      )
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()) || [];

  const verifyMutation = useMutation({
    mutationFn: ({ paymentId, notes }: { paymentId: string; notes?: string }) =>
      recoveryService.verifyPayment(paymentId, { approved: true, notes }),
    onSuccess: () => {
      toast.success('Payment verified successfully');
      setShowVerifyModal(false);
      setSelectedPayment(null);
      setVerificationNotes('');
      qc.invalidateQueries({ queryKey: ['recovery'] });
    },
    onError: () => toast.error('Failed to verify payment'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      recoveryService.verifyPayment(paymentId, { approved: false, notes: reason }),
    onSuccess: () => {
      toast.success('Payment rejected');
      setShowRejectModal(false);
      setSelectedPayment(null);
      setRejectionReason('');
      qc.invalidateQueries({ queryKey: ['recovery'] });
    },
    onError: () => toast.error('Failed to reject payment'),
  });

  const handleVerify = (paymentId: string) => {
    setSelectedPayment(paymentId);
    setShowVerifyModal(true);
  };

  const handleReject = (paymentId: string) => {
    setSelectedPayment(paymentId);
    setShowRejectModal(true);
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-header-mobile">
          <Breadcrumbs />
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-mobile">
        <Breadcrumbs />
        <div className="flex-mobile-col items-start md:items-center justify-between mt-3 md:mt-4 gap-3">
          <div>
            <h1 className="text-responsive-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Payment Verification
            </h1>
            <p className="text-responsive-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Review and verify recovery payments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={pendingPayments.length > 0 ? 'yellow' : 'gray'}>
              {pendingPayments.length} Pending
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6 p-mobile md:p-0">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="card-mobile">
            <div className="card-body text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                Pending Verification
              </p>
              <p className="text-responsive-2xl font-bold mt-1 text-yellow-600">
                {pendingPayments.length}
              </p>
            </div>
          </div>

          <div className="card-mobile">
            <div className="card-body text-center">
              <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                Total Amount Pending
              </p>
              <p className="text-responsive-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0))}
              </p>
            </div>
          </div>

          <div className="card-mobile">
            <div className="card-body text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                Unique Accounts
              </p>
              <p className="text-responsive-2xl font-bold mt-1 text-blue-600">
                {new Set(pendingPayments.map((p) => p.account.id)).size}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Payments List */}
        <div className="card-mobile">
          <div className="card-header">
            <p className="text-responsive-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Payments Awaiting Verification
            </p>
          </div>
          <div className="card-body">
            {pendingPayments.length > 0 ? (
              <div className="space-y-3">
                {pendingPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Left: Payment Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-responsive-lg font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-responsive-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                            </p>
                          </div>
                          <Badge variant="yellow">Pending</Badge>
                        </div>

                        {/* Account Info */}
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-responsive-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {payment.account.customerName}
                          </p>
                          <p className="text-responsive-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {payment.account.accountNumber} • {payment.account.customerPhone}
                          </p>
                        </div>

                        {/* Additional Details */}
                        <div className="mt-3 space-y-1">
                          {payment.reference && (
                            <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                              <strong>Reference:</strong> {payment.reference}
                            </p>
                          )}
                          {payment.notes && (
                            <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                              <strong>Notes:</strong> {payment.notes}
                            </p>
                          )}
                          {payment.recordedBy && (
                            <p className="text-responsive-xs" style={{ color: 'var(--text-muted)' }}>
                              Recorded by {payment.recordedBy.firstName} {payment.recordedBy.lastName} on{' '}
                              {formatDateTime(payment.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex lg:flex-col gap-2 lg:min-w-[140px]">
                        <button
                          onClick={() =>
                            navigate(`/recovery/accounts/${payment.account.id}?tab=payments`)
                          }
                          className="btn-ghost btn-responsive flex-1 lg:flex-none"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Account</span>
                        </button>
                        <button
                          onClick={() => handleVerify(payment.id)}
                          className="btn-primary btn-responsive flex-1 lg:flex-none"
                          disabled={verifyMutation.isPending || rejectMutation.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify</span>
                        </button>
                        <button
                          onClick={() => handleReject(payment.id)}
                          className="btn-ghost btn-responsive flex-1 lg:flex-none text-red-600 hover:bg-red-50"
                          disabled={verifyMutation.isPending || rejectMutation.isPending}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-responsive-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  No payments pending verification
                </p>
                <p className="text-responsive-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  All payments have been reviewed
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verify Modal */}
      {showVerifyModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Verify Payment
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to verify this payment? This will update the account balance and
              mark the payment as verified.
            </p>
            <div className="mb-4">
              <label className="form-label">Verification Notes (Optional)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Add any verification notes..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => verifyMutation.mutate({ paymentId: selectedPayment, notes: verificationNotes })}
                disabled={verifyMutation.isPending}
                className="btn-primary flex-1"
              >
                {verifyMutation.isPending ? 'Verifying...' : 'Verify Payment'}
              </button>
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setVerificationNotes('');
                }}
                disabled={verifyMutation.isPending}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Reject Payment</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Please provide a reason for rejecting this payment. The officer who recorded it will be
              notified.
            </p>
            <div className="mb-4">
              <label className="form-label">Rejection Reason *</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Why is this payment being rejected?"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => rejectMutation.mutate({ paymentId: selectedPayment, reason: rejectionReason })}
                disabled={!rejectionReason || rejectMutation.isPending}
                className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Payment'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={rejectMutation.isPending}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
