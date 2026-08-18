import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, AlertTriangle, CheckCircle2, RefreshCw, Download } from 'lucide-react';
import { api } from '@/lib/axios';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ReconciliationSummary {
  date: string;
  totalDisbursed: number;
  totalRepayments: number;
  expectedRepayments: number;
  overdueAmount: number;
  discrepancies: number;
  status: 'BALANCED' | 'DISCREPANCY' | 'PENDING';
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
}

export function ReconciliationPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'summary' | 'discrepancies' | 'unmatched'>('summary');

  // Fetch reconciliation summary
  const { data: summary, refetch } = useQuery<ReconciliationSummary>({
    queryKey: ['reconciliation', 'summary', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/reconciliation/summary?date=${selectedDate}`);
      return res.data?.data || {
        date: selectedDate,
        totalDisbursed: 0,
        totalRepayments: 0,
        expectedRepayments: 0,
        overdueAmount: 0,
        discrepancies: 0,
        status: 'PENDING',
      };
    },
  });

  // Fetch discrepancies
  const { data: discrepancies = [] } = useQuery<DiscrepancyItem[]>({
    queryKey: ['reconciliation', 'discrepancies', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/reconciliation/discrepancies?date=${selectedDate}`);
      return res.data?.data || [];
    },
    enabled: view === 'discrepancies',
  });

  // Fetch unmatched Paystack transactions
  const { data: unmatchedTransactions = [] } = useQuery<PaystackTransaction[]>({
    queryKey: ['reconciliation', 'unmatched', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/reconciliation/unmatched?date=${selectedDate}`);
      return res.data?.data || [];
    },
    enabled: view === 'unmatched',
  });

  const handleExport = async () => {
    // TODO: Export reconciliation report
    alert('Export functionality to be implemented');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reconciliation</h1>
          <p className="text-sm text-gray-500 mt-1">Daily payment reconciliation and discrepancy tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-input text-sm"
            max={new Date().toISOString().split('T')[0]}
          />
          <button onClick={() => refetch()} className="btn-secondary btn-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleExport} className="btn-primary btn-sm">
            <Download className="w-4 h-4" />
            Export Report
          </button>
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
                {summary.status === 'BALANCED' && 'All payments match expected amounts'}
                {summary.status === 'DISCREPANCY' && 'Review discrepancies below and take corrective action'}
                {summary.status === 'PENDING' && 'Waiting for end-of-day data'}
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
                <p className="text-xs text-gray-500">Disbursed Today</p>
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
                <p className="text-xs mt-1">Every Paystack payment is linked to a loan</p>
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
                      <button className="text-xs text-brand-600 hover:text-brand-700 mt-2">
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
