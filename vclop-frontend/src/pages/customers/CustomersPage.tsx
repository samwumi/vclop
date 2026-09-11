import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Plus, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { customersService } from '@/services/customers.service';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate, initials } from '@/lib/utils';
import type { Customer } from '@/types/domain.types';

const STATUS_BADGE: Record<string, { label: string; variant: 'green' | 'red' | 'yellow' | 'blue' | 'gray' }> = {
  PROSPECT:      { label: 'Prospect',      variant: 'gray' },
  REGISTERED:    { label: 'Registered',    variant: 'blue' },
  KYC_PENDING:   { label: 'KYC Pending',   variant: 'yellow' },
  KYC_VERIFIED:  { label: 'KYC Verified',  variant: 'blue' },
  ELIGIBLE:      { label: 'Eligible',      variant: 'green' },
  INELIGIBLE:    { label: 'Ineligible',    variant: 'red' },
  BLACKLISTED:   { label: 'Blacklisted',   variant: 'red' },
};

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { hasPermission } = useAuthStore();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customers', { page, search }],
    queryFn: () => customersService.list({ page, limit: 25, search }),
    placeholderData: (prev) => prev,
  });

  const COLUMNS = [
    { key: 'customer',   label: 'Customer' },
    { key: 'contact',    label: 'Contact' },
    { key: 'type',       label: 'Type',       width: '110px' },
    { key: 'completion', label: 'Profile',    width: '100px' },
    { key: 'status',     label: 'Status',     width: '130px' },
    { key: 'since',      label: 'Registered', width: '130px' },
    { key: 'actions',    label: '',           width: '50px' },
  ];

  return (
    <ModulePage
      title="Customers"
      subtitle="Customer onboarding, KYC, and profile management"
      icon={Users}
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(1); }}
      actions={[
        {
          label: 'Export CSV',
          icon: Download,
          onClick: () => {
            customersService.exportCsv({ search }).catch(() =>
              toast.error('Export failed — please try again'),
            );
          },
          permission: true,
        },
        { label: 'New Customer', icon: Plus, onClick: () => navigate('/customers/new'), variant: 'primary', permission: hasPermission('customers:create') },
      ]}
      columns={COLUMNS}
      isLoading={isLoading}
      isEmpty={!isLoading && (data?.data?.length ?? 0) === 0}
      isError={isError}
      error={error as Error}
      onRetry={() => refetch()}
      emptyIcon={Users}
      emptyTitle="No customers found"
      emptyDescription="Register your first customer to get started."
      meta={data?.meta}
      onPageChange={setPage}
      rows={
        <>
          {data?.data?.map((c: Customer) => {
            const s = STATUS_BADGE[c.status] ?? { label: c.status, variant: 'gray' as const };
            return (
              <tr key={c.id} className="cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                      {initials(c.firstName, c.lastName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.customerNumber}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <p className="text-xs">{c.phone}</p>
                  <p className="text-xs text-gray-400">{c.email ?? '—'}</p>
                </td>
                <td><span className="text-xs text-gray-600">{c.type === 'BUSINESS' ? 'Business' : 'Individual'}</span></td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${c.profileCompletion}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-7">{c.profileCompletion}%</span>
                  </div>
                </td>
                <td><Badge variant={s.variant}>{s.label}</Badge></td>
                <td className="text-xs text-gray-500">{formatDate(c.createdAt)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button className="btn-ghost btn-icon w-7 h-7" onClick={() => navigate(`/customers/${c.id}`)}>
                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </td>
              </tr>
            );
          })}
        </>
      }
    />
  );
}
