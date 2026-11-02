import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  recoveryService,
  type RecoveryStatus,
  type PriorityLevel,
} from '@/services/recovery.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
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

export function MyRecoveryAccountsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RecoveryStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | ''>('');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Fetch accounts assigned to current user
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['recovery', 'my-accounts', { search, status: statusFilter, priority: priorityFilter }],
    queryFn: () =>
      recoveryService.listAccounts({
        search,
        assignedOfficerId: user?.id,
        status: statusFilter || undefined,
        priorityLevel: priorityFilter || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  // Calculate summary stats
  const totalAccounts = accounts?.length || 0;
  const totalOutstanding = accounts?.reduce((sum, a) => sum + Number(a.outstandingBalance), 0) || 0;
  const totalRecovered = accounts?.reduce((sum, a) => sum + Number(a.recoveredAmount), 0) || 0;
  const urgentAccounts = accounts?.filter((a) => a.priorityLevel === 'URGENT').length || 0;
  const activePromises = accounts?.filter((a) => a.status === 'PROMISE_ACTIVE').length || 0;
  
  // Get accounts needing attention (high/urgent priority, in progress, with outstanding balance)
  const needsAttention = accounts?.filter(
    (a) =>
      (a.priorityLevel === 'HIGH' || a.priorityLevel === 'URGENT') &&
      (a.status === 'IN_PROGRESS' || a.status === 'ASSIGNED') &&
      a.outstandingBalance > 0,
  ) || [];

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
              My Recovery Accounts
            </h1>
            <p className="text-responsive-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Accounts assigned to you
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6 p-mobile md:p-0">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <div className="card-mobile">
            <div className="card-body">
              <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                Total Accounts
              </p>
              <p className="text-responsive-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {totalAccounts}
              </p>
            </div>
          </div>

          <div className="card-mobile">
            <div className="card-body">
              <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                Outstanding
              </p>
              <p className="text-responsive-lg font-bold mt-1 text-red-600">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
          </div>

          <div className="card-mobile">
            <div className="card-body">
              <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                Recovered
              </p>
              <p className="text-responsive-lg font-bold mt-1 text-green-600">
                {formatCurrency(totalRecovered)}
              </p>
            </div>
          </div>

          <div className="card-mobile">
            <div className="card-body">
              <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                Urgent Cases
              </p>
              <p className="text-responsive-2xl font-bold mt-1 text-red-600">
                {urgentAccounts}
              </p>
            </div>
          </div>

          <div className="card-mobile">
            <div className="card-body">
              <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                Active Promises
              </p>
              <p className="text-responsive-2xl font-bold mt-1 text-purple-600">
                {activePromises}
              </p>
            </div>
          </div>
        </div>

        {/* Needs Attention Section */}
        {needsAttention.length > 0 && (
          <div className="card-mobile border-2 border-red-200 bg-red-50">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-responsive-sm font-semibold text-red-800">
                  Needs Immediate Attention ({needsAttention.length})
                </p>
              </div>
            </div>
            <div className="card-body space-y-2">
              {needsAttention.slice(0, 5).map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md cursor-pointer transition-all"
                  onClick={() => navigate(`/recovery/accounts/${account.id}`)}
                >
                  <div className="flex-1">
                    <p className="text-responsive-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {account.customerName}
                    </p>
                    <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                      {account.accountNumber} • {account.customerPhone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-responsive-sm font-bold text-red-600">
                      {formatCurrency(account.outstandingBalance)}
                    </p>
                    <Badge variant={PRIORITY_CONFIG[account.priorityLevel].variant}>
                      {PRIORITY_CONFIG[account.priorityLevel].label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="card-mobile">
          <div className="card-body">
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search by name, phone, or account number..."
                className="input-field flex-1 min-w-[200px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="input-field text-xs"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RecoveryStatus | '')}
              >
                <option value="">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
              <select
                className="input-field text-xs"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityLevel | '')}
              >
                <option value="">All Priorities</option>
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
              {(search || statusFilter || priorityFilter) && (
                <button
                  className="btn-ghost text-xs"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setPriorityFilter('');
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Accounts List */}
        <div className="card-mobile">
          <div className="card-header">
            <p className="text-responsive-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              All My Accounts ({accounts?.length || 0})
            </p>
          </div>
          <div className="card-body">
            {accounts && accounts.length > 0 ? (
              <div className="space-y-2">
                {accounts.map((account) => {
                  const status = STATUS_CONFIG[account.status];
                  const priority = PRIORITY_CONFIG[account.priorityLevel];
                  const recoveryRate =
                    account.originalPrincipal > 0
                      ? (Number(account.recoveredAmount) / Number(account.originalPrincipal)) * 100
                      : 0;

                  return (
                    <div
                      key={account.id}
                      className="flex flex-col md:flex-row md:items-center gap-3 p-4 border rounded-lg hover:shadow-md cursor-pointer transition-all"
                      onClick={() => navigate(`/recovery/accounts/${account.id}`)}
                    >
                      {/* Left: Customer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-responsive-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {account.customerName}
                          </p>
                          <Badge variant={priority.variant}>{priority.label}</Badge>
                        </div>
                        <p className="text-responsive-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                          {account.accountNumber} • {account.customerPhone}
                        </p>
                        {account.lastPaymentDate && (
                          <div className="flex items-center gap-1 mt-1 text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="text-responsive-xs">
                              Last payment: {formatCurrency(account.lastPaymentAmount || 0)} on{' '}
                              {formatDate(account.lastPaymentDate)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Middle: Financial Info */}
                      <div className="flex gap-4 md:gap-6">
                        <div>
                          <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                            Outstanding
                          </p>
                          <p className="text-responsive-sm font-bold text-red-600">
                            {formatCurrency(account.outstandingBalance)}
                          </p>
                        </div>
                        <div>
                          <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                            Recovered
                          </p>
                          <p className="text-responsive-sm font-bold text-green-600">
                            {formatCurrency(account.recoveredAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                            Rate
                          </p>
                          <p className="text-responsive-sm font-bold" style={{ color: 'var(--brand-primary)' }}>
                            {recoveryRate.toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* Right: Status & Action */}
                      <div className="flex items-center gap-3 md:flex-col md:items-end">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/recovery/accounts/${account.id}`);
                          }}
                          className="btn-ghost btn-icon"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-responsive-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  No accounts assigned yet
                </p>
                <p className="text-responsive-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {search || statusFilter || priorityFilter
                    ? 'Try adjusting your filters'
                    : 'Recovery accounts will appear here when assigned to you'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
