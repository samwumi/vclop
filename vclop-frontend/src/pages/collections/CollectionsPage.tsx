import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingDown, CalendarClock, Plus } from 'lucide-react';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate } from '@/lib/utils';
import { collectionsService, type CollectionCase, type CollectionCaseStatus } from '@/services/collections.service';
import { CollectionCasePanel } from './CollectionCasePanel';

const STATUS_VARIANT: Record<CollectionCaseStatus, 'green' | 'red' | 'yellow' | 'blue' | 'gray'> = {
  OPEN: 'yellow',
  PROMISE_TO_PAY: 'blue',
  BROKEN_PROMISE: 'red',
  LEGAL: 'red',
  RESOLVED: 'green',
  WRITTEN_OFF: 'gray',
};

const STATUS_OPTS: Array<{ value: CollectionCaseStatus | ''; label: string }> = [
  { value: '', label: 'All cases' },
  { value: 'OPEN', label: 'Open' },
  { value: 'PROMISE_TO_PAY', label: 'Promise to Pay' },
  { value: 'BROKEN_PROMISE', label: 'Broken Promise' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'WRITTEN_OFF', label: 'Written Off' },
];

function daysPastDue(installments: CollectionCase['loan'] extends null | undefined ? never : NonNullable<CollectionCase['loan']>['installments']): number {
  const overdue = installments.filter(
    (i) => i.status !== 'PAID' && new Date(i.dueDate) < new Date(),
  );
  if (!overdue.length) return 0;
  const earliest = overdue.reduce((a, b) => new Date(a.dueDate) < new Date(b.dueDate) ? a : b);
  return Math.max(0, Math.floor((Date.now() - new Date(earliest.dueDate).getTime()) / 86_400_000));
}

export function CollectionsPage() {
  const [statusFilter, setStatusFilter] = useState<CollectionCaseStatus | ''>('');
  const [search, setSearch] = useState('');
  const [selectedCase, setSelectedCase] = useState<CollectionCase | null>(null);
  const { hasPermission } = useAuthStore();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['collection-cases', statusFilter],
    queryFn: () => collectionsService.list(statusFilter || undefined),
    placeholderData: (prev) => prev,
    refetchInterval: 60_000, // refresh every minute to catch new overdue loans
  });

  // Client-side search over customer name / loan number
  const filtered = cases.filter((c) => {
    if (!search) return true;
    const customer = c.loan?.loanApplication?.customer;
    const name = customer ? `${customer.firstName} ${customer.lastName}`.toLowerCase() : '';
    const loanNo = c.loan?.loanNumber?.toLowerCase() ?? '';
    const q = search.toLowerCase();
    return name.includes(q) || loanNo.includes(q) || customer?.customerNumber?.toLowerCase().includes(q);
  });

  return (
    <>
      {selectedCase && (
        <CollectionCasePanel
          collectionCase={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}

      <ModulePage
        title="Collections"
        subtitle="Overdue loan accounts — manage follow-ups, promises-to-pay and write-offs"
        icon={TrendingDown}
        search={search}
        onSearchChange={setSearch}
        actions={[]}
        columns={[
          { key: 'loan', label: 'Loan #' },
          { key: 'customer', label: 'Customer' },
          { key: 'overdue', label: 'Overdue Amount', width: '145px' },
          { key: 'dpd', label: 'DPD', width: '80px' },
          { key: 'nextAction', label: 'Next Action', width: '120px' },
          { key: 'status', label: 'Status', width: '130px' },
          { key: 'activities', label: 'Activities', width: '90px' },
          { key: 'action', label: '', width: '110px' },
        ]}
        isLoading={isLoading}
        isEmpty={!isLoading && filtered.length === 0}
        emptyIcon={TrendingDown}
        emptyTitle={statusFilter ? `No ${statusFilter.toLowerCase().replace(/_/g, ' ')} cases` : 'No collection cases'}
        emptyDescription="Overdue loans will appear here automatically once a collection case is opened."
        filters={
          <select
            className="form-input h-9 text-sm w-44"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CollectionCaseStatus | '')}
          >
            {STATUS_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        }
        rows={
          <>
            {filtered.map((c) => {
              const customer = c.loan?.loanApplication?.customer;
              const installments = c.loan?.installments ?? [];
              const overdue = installments.filter(
                (i) => i.status !== 'PAID' && new Date(i.dueDate) < new Date(),
              );
              const totalOverdue = overdue.reduce(
                (sum, i) => sum + (Number(i.totalDue) - Number(i.amountPaid)), 0,
              );
              const dpd = daysPastDue(installments);
              const activityCount = c.activities?.length ?? 0;

              return (
                <tr key={c.id}>
                  <td className="font-mono text-xs font-semibold text-brand-600">
                    {c.loan?.loanNumber ?? '—'}
                  </td>
                  <td>
                    <p className="text-sm font-medium text-gray-800">
                      {customer ? `${customer.firstName} ${customer.lastName}` : '—'}
                    </p>
                    <p className="text-xs text-gray-400">{customer?.phone ?? ''}</p>
                  </td>
                  <td className="font-medium text-red-600">
                    ₦{totalOverdue.toLocaleString()}
                  </td>
                  <td>
                    {dpd > 0 ? (
                      <Badge variant={dpd > 30 ? 'red' : 'yellow'}>{dpd}d</Badge>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="text-xs text-gray-500">
                    {c.nextActionAt ? (
                      <span className="flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        {formatDate(c.nextActionAt)}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <div className="space-y-1">
                      <Badge variant={STATUS_VARIANT[c.status]}>
                        {c.status.replace(/_/g, ' ')}
                      </Badge>
                      {c.promiseDate && c.status === 'PROMISE_TO_PAY' && (
                        <p className="text-xs text-blue-600">
                          ₦{Number(c.promiseAmount ?? 0).toLocaleString()} by {formatDate(c.promiseDate)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="text-xs text-gray-500 text-center">
                    {activityCount > 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-50 text-brand-700 font-semibold text-xs">
                        {activityCount}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {hasPermission('loan_applications:record_repayment') && (
                      <button
                        onClick={() => setSelectedCase(c)}
                        className="btn-secondary btn-sm gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Manage
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </>
        }
      />
    </>
  );
}
