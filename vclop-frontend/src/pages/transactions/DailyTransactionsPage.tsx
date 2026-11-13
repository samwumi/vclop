import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownUp, Download, Eye, CreditCard, Wallet } from 'lucide-react';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import {
  transactionsService,
  type TransactionType,
  type TransactionStatus,
} from '@/services/transactions.service';
import { formatCurrency, formatDate } from '@/lib/utils';

const TYPE_OPTIONS: Array<{ value: TransactionType; label: string }> = [
  { value: 'ALL', label: 'All Types' },
  { value: 'VIRTUAL_ACCOUNT', label: 'Virtual Account' },
  { value: 'MANUAL', label: 'Manual' },
];

const STATUS_OPTIONS: Array<{ value: TransactionStatus; label: string }> = [
  { value: 'ALL', label: 'All Status' },
  { value: 'MATCHED', label: 'Matched' },
  { value: 'UNMATCHED', label: 'Unmatched' },
];

const STATUS_VARIANT: Record<TransactionStatus, 'green' | 'yellow' | 'gray'> = {
  MATCHED: 'green',
  UNMATCHED: 'yellow',
  PENDING: 'yellow',
  ALL: 'gray',
};

export function DailyTransactionsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType>('ALL');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>('ALL');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['daily-transactions', startDate, endDate, typeFilter, statusFilter, search],
    queryFn: () =>
      transactionsService.getDailyTransactions({
        startDate,
        endDate,
        type: typeFilter,
        status: statusFilter,
        search,
      }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const transactions = data?.transactions || [];
  const summary = data?.summary;

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export transactions');
  };

  return (
    <div className="container mx-auto py-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Transactions</p>
              <ArrowDownUp className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{summary.totalCount}</p>
            <p className="text-sm text-gray-500">{formatCurrency(summary.totalAmount)}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-blue-700">Virtual Account</p>
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{summary.vaCount}</p>
            <p className="text-sm text-blue-600">{formatCurrency(summary.vaAmount)}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-green-700">Manual Entry</p>
              <Wallet className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-900">{summary.manualCount}</p>
            <p className="text-sm text-green-600">{formatCurrency(summary.manualAmount)}</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-yellow-700">Unmatched</p>
              <ArrowDownUp className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-900">{summary.unmatchedCount}</p>
            <p className="text-sm text-gray-500">
              {summary.matchedCount} matched
            </p>
          </div>
        </div>
      )}

      {/* Filters and Table */}
      <ModulePage
        title="Daily Transactions"
        subtitle="Track all repayments received today"
        icon={ArrowDownUp}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by customer, loan #, reference..."
        filter={
          <div className="flex gap-2">
            {/* Date Range */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-40"
            />
            <span className="text-gray-400 self-center">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-40"
            />

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionType)}
              className="input w-40"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TransactionStatus)}
              className="input w-36"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        }
        actions={[
          {
            label: 'Export',
            icon: Download,
            onClick: handleExport,
            permission: true,
          },
        ]}
        columns={[
          { key: 'time', label: 'Time' },
          { key: 'type', label: 'Type' },
          { key: 'customer', label: 'Customer' },
          { key: 'loan', label: 'Loan #' },
          { key: 'amount', label: 'Amount' },
          { key: 'reference', label: 'Reference' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: 'Actions' },
        ]}
        isLoading={isLoading}
        isEmpty={!isLoading && transactions.length === 0}
        isError={isError}
        error={error as Error}
        onRetry={refetch}
        emptyIcon={ArrowDownUp}
        emptyTitle="No transactions found"
        emptyDescription="Transactions will appear here as customers make repayments"
        rows={
          <>
            {transactions.map((txn) => (
              <tr key={txn.id} className="hover:bg-gray-50">
                <td className="text-xs text-gray-500">
                  {new Date(txn.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    {txn.type === 'VIRTUAL_ACCOUNT' ? (
                      <>
                        <CreditCard className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-blue-700">VA</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-700">Manual</span>
                      </>
                    )}
                  </div>
                </td>
                <td>
                  {txn.customer ? (
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {txn.customer.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {txn.customer.customerNumber}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {txn.payerName || '—'}
                    </span>
                  )}
                </td>
                <td className="text-xs font-mono text-gray-600">
                  {txn.loan?.loanNumber || '—'}
                </td>
                <td className="font-semibold">{formatCurrency(txn.amount)}</td>
                <td className="text-xs text-gray-600 font-mono max-w-xs truncate">
                  {txn.reference}
                </td>
                <td>
                  <Badge variant={STATUS_VARIANT[txn.status]}>
                    {txn.status}
                  </Badge>
                </td>
                <td>
                  <button className="btn-ghost btn-icon w-7 h-7">
                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </>
        }
      />
    </div>
  );
}
