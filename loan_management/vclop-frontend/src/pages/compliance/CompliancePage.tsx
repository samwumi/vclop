import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, Eye } from 'lucide-react';
import { loansService } from '@/services/loans.service';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { LoanApplication } from '@/types/domain.types';

export function CompliancePage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['compliance-queue', { page, search }],
    queryFn: () => loansService.list({ page, limit: 25, search, status: 'SUBMITTED' }),
    placeholderData: (previous) => previous,
  });

  return (
    <ModulePage
      title="Underwriting & Compliance"
      subtitle="Applications awaiting document, affordability, and field-verification review"
      icon={ClipboardCheck}
      search={search}
      onSearchChange={(value) => { setSearch(value); setPage(1); }}
      columns={[
        { key: 'reference', label: 'Application #' },
        { key: 'customer', label: 'Customer' },
        { key: 'product', label: 'Product' },
        { key: 'amount', label: 'Amount', width: '130px' },
        { key: 'submitted', label: 'Submitted', width: '130px' },
        { key: 'action', label: '', width: '100px' },
      ]}
      rows={data?.data.map((application: LoanApplication) => (
        <tr key={application.id}>
          <td className="font-mono text-xs font-semibold text-brand-600">{application.applicationNumber}</td>
          <td>
            <p className="text-sm font-medium text-gray-800">{application.customer ? `${application.customer.firstName} ${application.customer.lastName}` : '—'}</p>
            <p className="text-xs text-gray-400">{application.customer?.customerNumber}</p>
          </td>
          <td className="text-sm text-gray-600">{application.loanProduct?.name ?? '—'}</td>
          <td className="font-medium">₦{Number(application.amount).toLocaleString()}</td>
          <td><Badge variant="yellow">{formatDate(application.submittedAt ?? application.createdAt)}</Badge></td>
          <td>
            <button onClick={() => navigate(`/loans/${application.id}`)} className="btn-secondary btn-sm gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Review
            </button>
          </td>
        </tr>
      ))}
      isLoading={isLoading}
      isEmpty={!isLoading && (data?.data.length ?? 0) === 0}
      emptyIcon={ClipboardCheck}
      emptyTitle="No applications awaiting review"
      emptyDescription="Newly submitted loan applications will appear here automatically."
      meta={data?.meta}
      onPageChange={setPage}
    />
  );
}
