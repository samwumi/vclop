import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, User, DollarSign, FileText } from 'lucide-react';
import { staffLoansService } from '@/services/staff-loans.service';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

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

  const { data: loan, isLoading } = useQuery({
    queryKey: ['staff-loan', loanId],
    queryFn: () => staffLoansService.getLoanDetails(loanId!),
    enabled: !!loanId,
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
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">Loan Amount</p>
            <p className="text-xl font-bold">{formatCurrency(loan.amount)}</p>
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
            {loan.approvedAt && (
              <div>
                <p className="text-gray-500">Approved On</p>
                <p className="font-medium">{formatDate(loan.approvedAt)}</p>
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
              <span className="font-semibold">{formatCurrency(loan.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-semibold text-green-600">{formatCurrency(loan.amountPaid || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Outstanding</span>
              <span className="font-semibold text-orange-600">{formatCurrency(loan.outstandingAmount || loan.amount)}</span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between">
              <span className="text-gray-500">Installments Paid</span>
              <span className="font-semibold">{loan.installmentsPaid || 0} / {loan.tenureMonths}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Payment Progress</span>
              <span>{Math.round(((loan.amountPaid || 0) / loan.amount) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${Math.min(((loan.amountPaid || 0) / loan.amount) * 100, 100)}%` }}
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
