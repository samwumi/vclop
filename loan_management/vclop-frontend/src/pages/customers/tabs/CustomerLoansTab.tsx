import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Landmark, Plus } from 'lucide-react';
import { loansService } from '@/services/loans.service';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate } from '@/lib/utils';
import type { LoanApplicationStatus } from '@/types/domain.types';

const STATUS_VARIANT: Record<LoanApplicationStatus, 'green' | 'red' | 'yellow' | 'blue' | 'gray'> = {
  DRAFT: 'gray', SUBMITTED: 'yellow', COMPLIANCE_REVIEW: 'yellow', AWAITING_INFORMATION: 'yellow', INTERNAL_CONTROL_REVIEW: 'yellow', ACCOUNTING_REVIEW: 'blue', APPROVED: 'blue', DISBURSED: 'green', REJECTED: 'red', RETURNED: 'yellow', ESCALATED: 'red', CANCELLED: 'gray',
};

export function CustomerLoansTab({ customerId }: { customerId: string }) {
  const { hasPermission } = useAuthStore();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['loans', 'by-customer', customerId],
    queryFn: () => loansService.list({ customerId, limit: 50 }),
  });

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
          {data.data.map((loan) => (
            <button
              key={loan.id}
              onClick={() => navigate(`/loans/${loan.id}`)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 text-left"
            >
              <div>
                <p className="text-sm font-medium text-gray-800 font-mono">{loan.applicationNumber}</p>
                <p className="text-xs text-gray-500">{loan.loanProduct?.name} · ₦{Number(loan.amount).toLocaleString()} · {formatDate(loan.createdAt)}</p>
              </div>
              <Badge variant={STATUS_VARIANT[loan.status]}>{loan.status}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
