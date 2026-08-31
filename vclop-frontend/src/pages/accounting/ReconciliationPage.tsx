import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, AlertTriangle, CheckCircle2, RefreshCw, Download, Link2 } from 'lucide-react';
import { api } from '@/lib/axios';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface ReconciliationSummary {
  date: string;
  totalDisbursed: number;
  totalRepayments: number;
  expectedRepayments: number;
  overdueAmount: number;
  discrepancies: number;
  status: 'BALANCED' | 'DISCREPANCY' | 'PENDING';
}

interface GroupedSummary {
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'week' | 'month';
  periods: ReconciliationSummary[];
  totals: ReconciliationSummary;
}

interface DiscrepancyItem {
  id: string;
  type: 'MISSING_PAYMENT' | 'DUPLICATE_PAYMENT' | 'AMOUNT_MISMATCH' | 'UNMATCHED_PAYMENT';
  loanNumber?: string;
  customerName?: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  paymentDate: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface PaystackTransaction {
  reference: string;
  amount: number;
  customerName: string;
  accountNumber: string;
  date: string;
  matched: boolean;
  loanNumber?: string;
  transactionId: string;
}

export function ReconciliationPage() {
  const qc = useQueryClient();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState<'' | 'day' | 'week' | 'month'>('');
  const [view, setView] = useState<'summary' | 'discrepancies' | 'unmatched'>('summary');

  // Fetch reconciliation summary
  const { data: summaryData, refetch } = useQuery<ReconciliationSummary | GroupedSummary>({
    queryKey: ['reconciliation', 'summary', startDate, endDate, groupBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('startDate', startDate);
      if (endDate && endDate !== startDate) params.set('endDate', endDate);
      if (groupBy) params.set('groupBy', groupBy);
      
      const res = await api.get(`/reconciliation/summary?${params}`);
      return res.data?.data;
    },
  });

  // Extract summary for display (either single or totals from grouped)
  const summary: ReconciliationSummary | undefined = summaryData 
    ? ('totals' in summaryData ? summaryData.totals : summaryData)
    : undefined;

  // Fetch discrepancies
  const { data: discrepancies = [] } = useQuery<DiscrepancyItem[]>({
    queryKey: ['reconciliation', 'discrepancies', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('startDate', startDate);
      if (endDate && endDate !== startDate) params.set('endDate', endDate);
      const res = await api.get(`/reconciliation/discrepancies?${params}`);
      return res.data?.data || [];
    },
    enabled: view === 'discrepancies',
  });

  // Fetch unmatched Paystack transactions
  const { data: unmatchedTransactions = [] } = useQuery<PaystackTransaction[]>({
    queryKey: ['reconciliation', 'unmatched', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('startDate', startDate);
      if (endDate && endDate !== startDate) params.set('endDate', endDate);
      const res = await api.get(`/reconciliation/unmatched?${params}`);
      return res.data?.data || [];
    },
    enabled: view === 'unmatched',
  });

  // Manual match mutation
  const matchMutation = useMutation({
    mutationFn: async ({ transactionId, virtualAccountId }: { transactionId: string; virtualAccountId: string }) => {
      const res = await api.patch(`/virtual-accounts/unmatched/${transactionId}/resolve`, { virtualAccountId });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Payment matched successfully');
      qc.invalidateQueries({ queryKey: ['reconciliation', 'unmatched'] });
      qc.invalidateQueries({ queryKey: ['reconciliation', 'summary'] });
    },
    onError: () => {
      toast.error('Failed to match payment');
    },
  });

  const handleManualMatch = (txnId: string) => {
    const virtualAccountId = window.prompt('Enter Virtual Account ID to match this payment to:');
    if (virtualAccountId) {
      matchMutation.mutate({ transactionId: txnId, virtualAccountId });
    }
  };

  const handleExport = async () => {
    toast.info('Export functionality coming soon');
  };

  const handleQuickDate = (period: 'today' | 'week' | 'month') => {
    const today = new Date().toISOString().split('T')[0];
    if (period === 'today') {
      setStartDate(today);
      setEndDate(today);
      setGroupBy('');
    } else if (period === 'week') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      setStartDate(weekStart.toISOString().split('T')[0]);
      setEndDate(today);
      setGroupBy('day');
    } else {
      const monthStart = new Date();
      monthStart.setDate(1);
      setStartDate(monthStart.toISOString().split('T')[0]);
      setEndDate(today);
      setGroupBy('week');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reconciliation</h1>
          <p className="text-sm text-gray-500 mt-1">Payment reconciliation and discrepancy tracking</p>
        </div>
        <button onClick={handleExport} className="btn-primary btn-sm">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Date Range & Grouping Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="form-label text-xs">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input text-sm"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="form-label text-xs">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input text-sm"
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="form-label text-xs">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as '' | 'day' | 'week' | 'month')}
              className="form-input text-sm"
            >
              <option value="">No Grouping</option>
              <option value="day">By Day</option>
              <option value="week">By Week</option>
              <option value="month">By Month</option>
            </select>
          </div>
          <button onClick={() => refetch()} className="btn-secondary btn-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="ml-auto flex gap-2">
            <button onClick={() => handleQuickDate('today')} className="btn-ghost btn-sm">Today</button>
            <button onClick={() => handleQuickDate('week')} className="btn-ghost btn-sm">Last 7 Days</button>
            <button onClick={() => handleQuickDate('month')} className="btn-ghost btn-sm">This Month</button>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {summary && (
        <div className={`rounded-lg p-4 border ${
          summary.status === 'BALANCED' 
            ? 'bg-emerald-50 border-emerald-200' 
            : summary.status === 'DISCREPANCY'
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            {summary.status === 'BALANCED' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {summary.status === 'BALANCED' && 'All Transactions Balanced'}
                {summary.status === 'DISCREPANCY' && `${summary.discrepancies} Discrepancies Found`}
                {summary.status === 'PENDING' && 'Reconciliation Pending'}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {summary.date}
                {groupBy && summaryData && 'periods' in summaryData && ` • ${summaryData.periods.length} ${groupBy}s`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Total Disbursed</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalDisbursed)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Repayments Received</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalRepayments)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Expected Repayments</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.expectedRepayments)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Discrepancies</p>
                <p className="text-lg font-bold text-gray-900">{summary.discrepancies}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grouped Periods Table (if grouping is enabled) */}
      {summaryData && 'periods' in summaryData && summaryData.periods.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Period Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Disbursed</th>
                  <th>Received</th>
                  <th>Expected</th>
                  <th>Variance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.periods.map((period, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{period.date}</td>
                    <td>{formatCurrency(period.totalDisbursed)}</td>
                    <td>{formatCurrency(period.totalRepayments)}</td>
                    <td>{formatCurrency(period.expectedRepayments)}</td>
                    <td className={period.totalRepayments >= period.expectedRepayments ? 'text-emerald-600' : 'text-red-600'}>
                      {formatCurrency(period.totalRepayments - period.expectedRepayments)}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        period.status === 'BALANCED' ? 'bg-emerald-100 text-emerald-700' :
                        period.status === 'DISCREPANCY' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {period.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setView('summary')}
            className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
              view === 'summary'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setView('discrepancies')}
            className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
              view === 'discrepancies'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Discrepancies ({discrepancies.length})
          </button>
          <button
            onClick={() => setView('unmatched')}
            className={`pb-3 border-b-2 text-sm font-medium transition-colors ${
              view === 'unmatched'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Unmatched Transactions ({unmatchedTransactions.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {view === 'summary' && (
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Reconciliation Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Loans Disbursed</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(summary?.totalDisbursed || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Repayments Received</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(summary?.totalRepayments || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Expected Repayments</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(summary?.expectedRepayments || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Variance</span>
                <span className={`text-sm font-medium ${
                  (summary?.totalRepayments || 0) >= (summary?.expectedRepayments || 0)
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}>
                  {formatCurrency((summary?.totalRepayments || 0) - (summary?.expectedRepayments || 0))}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Overdue Amount</span>
                <span className="text-sm font-medium text-red-600">
                  {formatCurrency(summary?.overdueAmount || 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {view === 'discrepancies' && (
          <div className="divide-y divide-gray-100">
            {discrepancies.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p className="text-sm font-medium">No discrepancies found</p>
                <p className="text-xs mt-1">All transactions are balanced</p>
              </div>
            ) : (
              discrepancies.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                          item.severity === 'HIGH'
                            ? 'bg-red-100 text-red-700'
                            : item.severity === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.severity}
                        </span>
                        <span className="text-xs text-gray-500">{item.type.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      {item.loanNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          Loan: {item.loanNumber} • {item.customerName}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        Difference: {formatCurrency(Math.abs(item.difference))}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Expected: {formatCurrency(item.expectedAmount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Actual: {formatCurrency(item.actualAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'unmatched' && (
          <div className="divide-y divide-gray-100">
            {unmatchedTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p className="text-sm font-medium">All transactions matched</p>
                <p className="text-xs mt-1">Every payment is linked to a loan</p>
              </div>
            ) : (
              unmatchedTransactions.map((txn) => (
                <div key={txn.reference} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{txn.customerName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Ref: {txn.reference} • Account: {txn.accountNumber}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(txn.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(txn.amount)}
                      </p>
                      <button
                        onClick={() => handleManualMatch(txn.transactionId)}
                        disabled={matchMutation.isPending}
                        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 mt-2 disabled:opacity-50"
                      >
                        <Link2 className="w-3 h-3" />
                        Match Manually
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
