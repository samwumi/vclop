import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HandCoins, Plus, Eye } from 'lucide-react';
import {
  recoveryService,
  type RecoverySource,
  type RecoveryStatus,
  type PriorityLevel,
} from '@/services/recovery.service';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth.store';
import { formatCurrency, formatDate } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<
  RecoveryStatus,
  { label: string; variant: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple' }
> = {
  PENDING_VERIFICATION: { label: 'Pending', variant: 'gray' },
  ASSIGNED: { label: 'Assigned', variant: 'blue' },
  IN_PROGRESS: { label: 'In Progress', variant: 'blue' },
  PROMISE_ACTIVE: { label: 'Promise Active', variant: 'purple' },
  LEGAL_ACTION: { label: 'Legal', variant: 'red' },
  PARTIALLY_RECOVERED: { label: 'Partial', variant: 'yellow' },
  FULLY_RECOVERED: { label: 'Recovered', variant: 'green' },
  WRITTEN_OFF: { label: 'Written Off', variant: 'gray' },
  CLOSED: { label: 'Closed', variant: 'gray' },
};

const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: string; variant: 'green' | 'red' | 'yellow' | 'blue' | 'gray' }
> = {
  LOW: { label: 'Low', variant: 'gray' },
  MEDIUM: { label: 'Medium', variant: 'blue' },
  HIGH: { label: 'High', variant: 'yellow' },
  URGENT: { label: 'Urgent', variant: 'red' },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function RecoveryAccountsPage() {
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuthStore();
  const navigate = useNavigate();

  // Get filters from URL
  const statusFilter = (searchParams.get('status') as RecoveryStatus) || undefined;
  const sourceFilter = (searchParams.get('source') as RecoverySource) || undefined;
  const priorityFilter = (searchParams.get('priority') as PriorityLevel) || undefined;

  const { data: accounts, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recovery', 'accounts', { search, status: statusFilter, source: sourceFilter, priority: priorityFilter }],
    queryFn: () =>
      recoveryService.listAccounts({
        search,
        status: statusFilter,
        source: sourceFilter,
        priorityLevel: priorityFilter,
      }),
    placeholderData: (prev) => prev,
  });

  const COLUMNS = [
    { key: 'account', label: 'Account' },
    { key: 'customer', label: 'Customer' },
    { key: 'source', label: 'Source', width: '100px' },
    { key: 'outstanding', label: 'Outstanding', width: '130px' },
    { key: 'recovered', label: 'Recovered', width: '130px' },
    { key: 'priority', label: 'Priority', width: '100px' },
    { key: 'status', label: 'Status', width: '140px' },
    { key: 'officer', label: 'Officer', width: '150px' },
    { key: 'actions', label: '', width: '50px' },
  ];

  const handleFilterChange = (key: string, value: string | undefined) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  const activeFiltersCount = [statusFilter, sourceFilter, priorityFilter].filter(Boolean).length;

  return (
    <ModulePage
      title="Recovery Accounts"
      subtitle="Track and manage loan recovery accounts"
      icon={HandCoins}
      search={search}
      onSearchChange={(v) => setSearch(v)}
      actions={[
        {
          label: 'New Account',
          icon: Plus,
          onClick: () => navigate('/recovery/accounts/new'),
          variant: 'primary',
          permission: hasPermission('recovery:accounts_create'),
        },
      ]}
      filters={
        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <select
            className="input-field text-xs py-1.5 px-2"
            value={statusFilter || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            className="input-field text-xs py-1.5 px-2"
            value={sourceFilter || ''}
            onChange={(e) => handleFilterChange('source', e.target.value || undefined)}
          >
            <option value="">All Sources</option>
            <option value="LEGACY">Historical Loans</option>
            <option value="VCLOP">VCLOP Defaulted</option>
          </select>

          {/* Priority Filter */}
          <select
            className="input-field text-xs py-1.5 px-2"
            value={priorityFilter || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
          >
            <option value="">All Priorities</option>
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              className="btn-ghost text-xs"
              onClick={() => {
                setSearchParams({});
              }}
            >
              Clear Filters ({activeFiltersCount})
            </button>
          )}
        </div>
      }
      columns={COLUMNS}
      isLoading={isLoading}
      isEmpty={!isLoading && (accounts?.length ?? 0) === 0}
      isError={isError}
      error={error as Error}
      onRetry={() => refetch()}
      emptyIcon={HandCoins}
      emptyTitle="No recovery accounts found"
      emptyDescription={
        search || activeFiltersCount > 0
          ? 'Try adjusting your search or filters.'
          : 'Create your first recovery account to get started.'
      }
      rows={
        <>
          {accounts?.map((account) => {
            const status = STATUS_CONFIG[account.status];
            const priority = PRIORITY_CONFIG[account.priorityLevel];

            return (
              <tr
                key={account.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/recovery/accounts/${account.id}`)}
              >
                {/* Account Number */}
                <td>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{account.accountNumber}</p>
                    <p className="text-xs text-gray-400">
                      {account.originalReference || 'No reference'}
                    </p>
                  </div>
                </td>

                {/* Customer */}
                <td>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{account.customerName}</p>
                    <p className="text-xs text-gray-400">{account.customerPhone}</p>
                  </div>
                </td>

                {/* Source */}
                <td>
                  <Badge variant={account.source === 'LEGACY' ? 'blue' : 'green'}>
                    {account.source === 'LEGACY' ? 'Legacy' : 'VCLOP'}
                  </Badge>
                </td>

                {/* Outstanding Balance */}
                <td>
                  <p className="text-sm font-semibold text-red-600">
                    {formatCurrency(account.outstandingBalance)}
                  </p>
                  <p className="text-xs text-gray-400">
                    of {formatCurrency(account.originalPrincipal)}
                  </p>
                </td>

                {/* Recovered Amount */}
                <td>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(account.recoveredAmount)}
                  </p>
                  {account.totalExpenses > 0 && (
                    <p className="text-xs text-gray-400">
                      Net: {formatCurrency(account.netRecovery)}
                    </p>
                  )}
                </td>

                {/* Priority */}
                <td>
                  <Badge variant={priority.variant}>{priority.label}</Badge>
                </td>

                {/* Status */}
                <td>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>

                {/* Assigned Officer */}
                <td>
                  {account.assignedOfficer ? (
                    <div>
                      <p className="text-xs font-medium text-gray-800">
                        {account.assignedOfficer.firstName} {account.assignedOfficer.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {account.assignedDate ? formatDate(account.assignedDate) : ''}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Unassigned</span>
                  )}
                </td>

                {/* Actions */}
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-ghost btn-icon w-7 h-7"
                    onClick={() => navigate(`/recovery/accounts/${account.id}`)}
                  >
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
