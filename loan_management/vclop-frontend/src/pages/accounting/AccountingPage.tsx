import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, Eye, Send } from 'lucide-react';
import { toast } from 'sonner';
import { loansService } from '@/services/loans.service';
import { ModulePage } from '@/components/ui/ModulePage';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import type { LoanApplication } from '@/types/domain.types';

export function AccountingPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['accounting-disbursements', { page, search }],
    queryFn: () => loansService.list({ page, limit: 25, search, status: 'APPROVED' }),
    placeholderData: (previous) => previous,
  });

  const disburseMutation = useMutation({
    mutationFn: loansService.disburse,
    onSuccess: () => {
      toast.success('Loan disbursed successfully');
      queryClient.invalidateQueries({ queryKey: ['accounting-disbursements'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
    onError: () => toast.error('Unable to disburse this loan'),
  });

  return (
    <ModulePage
      title="Accounting Disbursement"
      subtitle="Approved applications ready for authorised fund release"
      icon={Banknote}
      search={search}
      onSearchChange={(value) => { setSearch(value); setPage(1); }}
      columns={[
        { key: 'reference', label: 'Application #' },
        { key: 'customer', label: 'Customer' },
        { key: 'product', label: 'Product' },
        { key: 'amount', label: 'Approved Amount', width: '150px' },
        { key: 'approved', label: 'Approved', width: '130px' },
        { key: 'action', label: '', width: '190px' },
      ]}
      rows={data?.data.map((application: LoanApplication) => (
        <tr key={application.id}>
          <td className="font-mono text-xs font-semibold text-brand-600">{application.applicationNumber}</td>
          <td className="text-sm font-medium text-gray-800">{application.customer ? `${application.customer.firstName} ${application.customer.lastName}` : '—'}</td>
          <td className="text-sm text-gray-600">{application.loanProduct?.name ?? '—'}</td>
          <td className="font-medium">₦{Number(application.amount).toLocaleString()}</td>
          <td className="text-xs text-gray-500">{formatDate(application.reviewedAt)}</td>
          <td className="flex gap-2 py-2">
            <button onClick={() => navigate(`/loans/${application.id}`)} className="btn-secondary btn-sm gap-1.5"><Eye className="w-3.5 h-3.5" /> View</button>
            {hasPermission('DISBURSE_LOAN') && (
              <button onClick={() => disburseMutation.mutate(application.id)} disabled={disburseMutation.isPending} className="btn-primary btn-sm gap-1.5 disabled:opacity-50">
                <Send className="w-3.5 h-3.5" /> Disburse
              </button>
            )}
          </td>
        </tr>
      ))}
      isLoading={isLoading}
      isEmpty={!isLoading && (data?.data.length ?? 0) === 0}
      emptyIcon={Banknote}
      emptyTitle="No loans awaiting disbursement"
      emptyDescription="Applications approved by internal control will appear here."
      meta={data?.meta}
      onPageChange={setPage}
    />
  );
}
