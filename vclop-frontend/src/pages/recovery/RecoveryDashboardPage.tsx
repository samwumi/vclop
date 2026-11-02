import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Banknote,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  HandCoins,
  Phone,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { recoveryService, type RecoveryStatus } from '@/services/recovery.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { formatCurrency, formatDate } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  onClick,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: typeof Banknote;
  color: string;
  onClick?: () => void;
  subtitle?: string;
}) {
  return (
    <div
      className={`stat-card ${onClick ? 'clickable-mobile cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <div className={`stat-card-icon ${color}`}>
        <Icon className="w-5 h-5 icon-premium-static" />
      </div>
      <p className="stat-card-label">{title}</p>
      <p className="stat-card-value text-responsive-lg">{value}</p>
      {subtitle && (
        <p className="text-responsive-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: RecoveryStatus }) {
  const statusConfig: Record<
    RecoveryStatus,
    { label: string; color: string; bg: string }
  > = {
    PENDING_VERIFICATION: { label: 'Pending', color: 'text-gray-600', bg: 'bg-gray-100' },
    ASSIGNED: { label: 'Assigned', color: 'text-blue-600', bg: 'bg-blue-100' },
    IN_PROGRESS: { label: 'In Progress', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    PROMISE_ACTIVE: { label: 'Promise Active', color: 'text-purple-600', bg: 'bg-purple-100' },
    LEGAL_ACTION: { label: 'Legal Action', color: 'text-red-600', bg: 'bg-red-100' },
    PARTIALLY_RECOVERED: { label: 'Partial Recovery', color: 'text-orange-600', bg: 'bg-orange-100' },
    FULLY_RECOVERED: { label: 'Fully Recovered', color: 'text-green-600', bg: 'bg-green-100' },
    WRITTEN_OFF: { label: 'Written Off', color: 'text-gray-600', bg: 'bg-gray-200' },
    CLOSED: { label: 'Closed', color: 'text-gray-500', bg: 'bg-gray-100' },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
    >
      {config.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function RecoveryDashboardPage() {
  const navigate = useNavigate();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['recovery', 'dashboard'],
    queryFn: () => recoveryService.getDashboard(),
  });

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

  if (!dashboard) {
    return (
      <div className="page-container">
        <div className="page-header-mobile">
          <Breadcrumbs />
        </div>
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const { summary, accountsByStatus, accountsBySource, recentPayments, activePromises, upcomingFollowups } =
    dashboard;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-mobile">
        <Breadcrumbs />
        <div className="flex-mobile-col items-start md:items-center justify-between mt-3 md:mt-4 gap-3">
          <div>
            <h1 className="text-responsive-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Loan Recovery Dashboard
            </h1>
            <p className="text-responsive-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              DROS - Debt Resolution Operating System
            </p>
          </div>
          <button
            onClick={() => navigate('/recovery/accounts/new')}
            className="btn-primary btn-responsive"
          >
            <FileText className="w-4 h-4" />
            <span>New Recovery Account</span>
          </button>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6 p-mobile md:p-0">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
          <StatCard
            title="Total Accounts"
            value={summary.totalAccounts}
            icon={Users}
            color="bg-blue-50 text-blue-600"
            onClick={() => navigate('/recovery/accounts')}
          />
          <StatCard
            title="Outstanding Balance"
            value={formatCurrency(summary.totalOutstanding)}
            icon={AlertTriangle}
            color="bg-red-50 text-red-600"
          />
          <StatCard
            title="Recovered Amount"
            value={formatCurrency(summary.totalRecovered)}
            icon={TrendingUp}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            title="Recovery Expenses"
            value={formatCurrency(summary.totalExpenses)}
            icon={TrendingDown}
            color="bg-orange-50 text-orange-600"
          />
          <StatCard
            title="Net Recovery"
            value={formatCurrency(summary.netRecovery)}
            icon={HandCoins}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            title="Recovery Rate"
            value={`${summary.recoveryRate.toFixed(1)}%`}
            icon={DollarSign}
            color="bg-purple-50 text-purple-600"
          />
        </div>

        {/* Accounts by Status and Source */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* By Status */}
          <div className="card-mobile">
            <div className="card-header">
              <p className="text-responsive-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Accounts by Status
              </p>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {accountsByStatus.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/recovery/accounts?status=${item.status}`)}
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={item.status} />
                    </div>
                    <span className="text-responsive-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* By Source */}
          <div className="card-mobile">
            <div className="card-header">
              <p className="text-responsive-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Accounts by Source
              </p>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {accountsBySource.map((item) => (
                  <div key={item.source} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-responsive-sm font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {item.source === 'LEGACY' ? 'Historical Loans' : 'VCLOP Defaulted'}
                      </span>
                      <span className="text-responsive-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {item.count}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(item.count / summary.totalAccounts) * 100}%`,
                          background: item.source === 'LEGACY' ? 'var(--brand-primary)' : 'var(--success-green)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active Promises & Upcoming Followups */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Active Promises */}
          <div className="card-mobile">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <p className="text-responsive-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Active Payment Promises
                </p>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600"
                >
                  {activePromises}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-responsive-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {activePromises} customers have promised to pay
                  </p>
                  <p className="text-responsive-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Track and follow up on payment commitments
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Followups */}
          <div className="card-mobile">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <p className="text-responsive-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Upcoming Followups (7 Days)
                </p>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600"
                >
                  {upcomingFollowups.length}
                </span>
              </div>
            </div>
            <div className="card-body">
              {upcomingFollowups.length === 0 ? (
                <div className="text-center py-6">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-responsive-sm" style={{ color: 'var(--text-secondary)' }}>
                    No upcoming followups scheduled
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {upcomingFollowups.slice(0, 5).map((followup) => (
                    <div
                      key={followup.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => navigate(`/recovery/accounts/${followup.accountId}`)}
                    >
                      <Phone className="w-5 h-5 mt-0.5 text-orange-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-responsive-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {followup.account.customerName}
                        </p>
                        <p className="text-responsive-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                          {followup.account.accountNumber} • {followup.account.customerPhone}
                        </p>
                        <p className="text-responsive-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          Due: {formatDate(followup.nextFollowupDate!)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card-mobile">
          <div className="card-header">
            <p className="text-responsive-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent Verified Payments (Last 30 Days)
            </p>
          </div>
          <div className="card-body">
            {recentPayments.length === 0 ? (
              <div className="text-center py-6">
                <Banknote className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-responsive-sm" style={{ color: 'var(--text-secondary)' }}>
                  No verified payments in the last 30 days
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-responsive-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-responsive-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Account
                      </th>
                      <th className="text-left py-3 px-4 text-responsive-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Customer
                      </th>
                      <th className="text-right py-3 px-4 text-responsive-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-responsive-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Method
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/recovery/accounts/${payment.accountId}`)}
                      >
                        <td className="py-3 px-4 text-responsive-sm" style={{ color: 'var(--text-primary)' }}>
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="py-3 px-4 text-responsive-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {payment.account.accountNumber}
                        </td>
                        <td className="py-3 px-4 text-responsive-sm" style={{ color: 'var(--text-secondary)' }}>
                          {payment.account.customerName}
                        </td>
                        <td className="py-3 px-4 text-responsive-sm text-right font-semibold text-green-600">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 px-4 text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                          {payment.paymentMethod}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
