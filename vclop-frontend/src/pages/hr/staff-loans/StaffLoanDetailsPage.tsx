import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, DollarSign, FileText, Send, Check, X } from 'lucide-react';
import { staffLoansService, ApproveLoanDto } from '@/services/staff-loans.service';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', variant: 'gray' as const },
  PENDING_APPROVAL: { label: 'Pending', variant: 'yellow' as const },
  APPROVED: { label: 'Approved', variant: 'blue' as const },
  REJECTED: { label: 'Rejected', variant: 'red' as const },
  DISBURSED: { label: 'Disbursed', variant: 'blue' as const },
  ACTIVE: { label: 'Active', variant: 'green' as const },
  FULLY_PAID: { label: 'Paid', variant: 'green' as const },
  DEFAULTED: { label: 'Defaulted', variant: 'red' as const },
};

export function StaffLoanDetailsPage() {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const { data: loan, isLoading } = useQuery({
    queryKey: ['staff-loan', loanId],
    queryFn: () => staffLoansService.getLoanById(loanId!),
    enabled: !!loanId,
  });

  const submitMutation = useMutation({
    mutationFn: () => staffLoansService.submitLoan(loanId!),
    onSuccess: () => {
      toast.success('Loan submitted for approval successfully');
      queryClient.invalidateQueries({ queryKey: ['staff-loan', loanId] });
      queryClient.invalidateQueries({ queryKey: ['my-staff-loans'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit loan');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (data: ApproveLoanDto) => 
      staffLoansService.approveLoan(loanId!, data),
    onSuccess: () => {
      toast.success('Loan approved successfully');
      queryClient.invalidateQueries({ queryKey: ['staff-loan', loanId] });
      queryClient.invalidateQueries({ queryKey: ['all-staff-loans'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve loan');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => staffLoansService.rejectLoan(loanId!, reason),
    onSuccess: () => {
      toast.success('Loan rejected');
      queryClient.invalidateQueries({ queryKey: ['staff-loan', loanId] });
      queryClient.invalidateQueries({ queryKey: ['all-staff-loans'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject loan');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading loan details...</p>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-gray-600">Loan not found</p>
          <button onClick={() => navigate('/hr/staff-loans/my-loans')} className="btn btn-primary mt-4">
            Back to My Loans
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[loan.status] || { label: loan.status, variant: 'gray' as const };
  const isOwnLoan = loan.userId === currentUser?.id;
  
  // Check if user has approval permission
  const hasApprovalPermission = currentUser?.permissions?.some(
    p => p === 'staff_loans:approve' || p === 'staff_loans:*' || p === '*:*'
  ) || false;
  
  // Show approve buttons if: has permission AND loan is pending
  const canApprove = loan.status === 'PENDING_APPROVAL' && hasApprovalPermission;
  
  // Calculate paid/outstanding amounts from repayment schedule if available
  const totalPaid = loan.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const outstanding = loan.totalRepayable - totalPaid;
  const installmentsPaid = loan.repaymentSchedule?.filter(i => i.status === 'PAID').length || 0;

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <button onClick={() => navigate('/hr/staff-loans/my-loans')} className="btn-ghost mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to My Loans
      </button>

      {/* Header */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Staff Loan Details</h1>
            <p className="text-sm text-gray-500 font-mono">{loan.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={status.variant}>{status.label}</Badge>
            
            {/* Submit button for draft loans */}
            {loan.status === 'DRAFT' && (isOwnLoan || hasApprovalPermission) && (
              <>
                <button
                  onClick={() => {
                    if (confirm('Submit this loan application for approval?')) {
                      submitMutation.mutate();
                    }
                  }}
                  disabled={submitMutation.isPending}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
                </button>
                
                {/* Quick approve for HR - submit and approve in one step */}
                {hasApprovalPermission && !isOwnLoan && (
                  <button
                    onClick={async () => {
                      const approvalNotes = prompt('Approval notes (optional):');
                      if (approvalNotes !== null) {
                        try {
                          // First submit
                          await submitMutation.mutateAsync();
                          // Then approve
                          const approvedAmount = loan.requestedAmount;
                          const approvedTenureMonths = loan.tenureMonths;
                          const interestRate = 0;
                          await approveMutation.mutateAsync({ 
                            approvedAmount, 
                            approvedTenureMonths, 
                            interestRate,
                            approvalNotes: approvalNotes || undefined 
                          });
                        } catch (error) {
                          // Errors already handled by mutations
                        }
                      }
                    }}
                    disabled={submitMutation.isPending || approveMutation.isPending}
                    className="btn btn-success flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Submit & Approve
                  </button>
                )}
              </>
            )}

            {/* Approve/Reject buttons for pending loans with approval permission */}
            {canApprove && (
              <>
                <button
                  onClick={() => {
                    // Use the requested amount and tenure, with 0% interest rate
                    const approvedAmount = loan.requestedAmount;
                    const approvedTenureMonths = loan.tenureMonths;
                    const interestRate = 0; // Staff loans are interest-free
                    const approvalNotes = prompt('Approval notes (optional):');
                    if (approvalNotes !== null) { // User didn't cancel
                      approveMutation.mutate({ 
                        approvedAmount, 
                        approvedTenureMonths, 
                        interestRate,
                        approvalNotes: approvalNotes || undefined 
                      });
                    }
                  }}
                  disabled={approveMutation.isPending}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {approveMutation.isPending ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Rejection reason (required):');
                    if (reason && reason.trim()) {
                      rejectMutation.mutate(reason);
                    } else if (reason !== null) {
                      toast.error('Rejection reason is required');
                    }
                  }}
                  disabled={rejectMutation.isPending}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">Loan Amount</p>
            <p className="text-xl font-bold">{formatCurrency(loan.principalAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Monthly Installment</p>
            <p className="text-xl font-bold">{formatCurrency(loan.monthlyInstallment)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Tenure</p>
            <p className="text-xl font-bold">{loan.tenureMonths} months</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Interest Rate</p>
            <p className="text-xl font-bold text-green-600">0%</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Loan Information
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Purpose</p>
              <p className="font-medium">{loan.purpose}</p>
            </div>
            <div>
              <p className="text-gray-500">Justification</p>
              <p className="text-gray-700">{loan.justification}</p>
            </div>
            <div>
              <p className="text-gray-500">Applied On</p>
              <p className="font-medium">{formatDate(loan.createdAt)}</p>
            </div>
            {loan.reviewedAt && (
              <div>
                <p className="text-gray-500">Approved On</p>
                <p className="font-medium">{formatDate(loan.reviewedAt)}</p>
              </div>
            )}
            {loan.disbursedAt && (
              <div>
                <p className="text-gray-500">Disbursed On</p>
                <p className="font-medium">{formatDate(loan.disbursedAt)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-semibold">{formatCurrency(loan.totalRepayable)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-semibold text-green-600">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Outstanding</span>
              <span className="font-semibold text-orange-600">{formatCurrency(outstanding)}</span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between">
              <span className="text-gray-500">Installments Paid</span>
              <span className="font-semibold">{installmentsPaid} / {loan.tenureMonths}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Payment Progress</span>
              <span>{Math.round((totalPaid / loan.totalRepayable) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${Math.min((totalPaid / loan.totalRepayable) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Approval Info */}
      {loan.status === 'REJECTED' && loan.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-900 mb-2">Rejection Reason</h4>
          <p className="text-red-700 text-sm">{loan.rejectionReason}</p>
        </div>
      )}
    </div>
  );
}
