import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Eye, TrendingDown } from 'lucide-react';
import { loansService } from '@/services/loans.service';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { LoanApplication } from '@/types/domain.types';

function daysPastDue(dueDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86_400_000));
}

export function CollectionsPage() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['collections-overdue', search],
    queryFn: () => loansService.list({ page: 1, limit: 100, search, status: 'DISBURSED' }),
  });

  const overdueApplications = useMemo(() => (data?.data ?? []).filter((application) =>
    application.loan?.status === 'ACTIVE' && application.loan.installments.some((installment) => installment.status === 'OVERDUE'),
  ), [data]);

  return (
    <ModulePage
      title="Collections"
      subtitle="Active loans with overdue repayment instalments"
      icon={TrendingDown}
      search={search}
      onSearchChange={setSearch}
      columns={[
        { key: 'loan', label: 'Loan #' },
        { key: 'customer', label: 'Customer' },
        { key: 'dpd', label: 'DPD', width: '90px' },
        { key: 'overdue', label: 'Overdue Amount', width: '145px' },
        { key: 'nextDue', label: 'Earliest Due', width: '135px' },
        { key: 'action', label: '', width: '110px' },
      ]}
      rows={overdueApplications.map((application: LoanApplication) => {
        const overdue = application.loan!.installments.filter((installment) => installment.status === 'OVERDUE');
        const earliest = overdue.reduce((current, installment) => new Date(installment.dueDate) < new Date(current.dueDate) ? installment : current);
        const overdueAmount = overdue.reduce((total, installment) => total + (Number(installment.totalDue) - Number(installment.amountPaid)), 0);
        return (
          <tr key={application.id}>
            <td className="font-mono text-xs font-semibold text-brand-600">{application.loan!.loanNumber}</td>
            <td className="text-sm font-medium text-gray-800">{application.customer ? `${application.customer.firstName} ${application.customer.lastName}` : '—'}</td>
            <td><Badge variant="red">{daysPastDue(earliest.dueDate)} days</Badge></td>
            <td className="font-medium">₦{overdueAmount.toLocaleString()}</td>
            <td className="text-xs text-gray-500"><span className="inline-flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" />{formatDate(earliest.dueDate)}</span></td>
            <td><button onClick={() => navigate(`/loans/${application.id}`)} className="btn-secondary btn-sm gap-1.5"><Eye className="w-3.5 h-3.5" /> Manage</button></td>
          </tr>
        );
      })}
      isLoading={isLoading}
      isEmpty={!isLoading && overdueApplications.length === 0}
      emptyIcon={TrendingDown}
      emptyTitle="No overdue accounts"
      emptyDescription="Overdue active loans will be added here automatically."
    />
  );
}
