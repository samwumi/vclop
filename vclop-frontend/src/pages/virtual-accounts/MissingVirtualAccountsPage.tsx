import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, XCircle, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios';

interface LoanWithoutVA {
  loanId: string;
  loanNumber: string;
  customerId: string;
  customerNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  hasBankAccount: boolean;
  principal: number;
  loanProduct: string;
  disbursedAt: string;
}

interface PendingVA {
  virtualAccountId: string;
  loanId: string;
  loanNumber: string;
  customerNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  principal: number;
  loanProduct: string;
  pendingAccountNumber: string;
  createdAt: string;
  daysPending: number;
}

interface BulkCreateResult {
  total: number;
  created: number;
  skipped: number;
  failed: number;
  details: Array<{
    loanNumber: string;
    status: 'created' | 'skipped' | 'failed';
    reason?: string;
  }>;
}

interface BulkSyncResult {
  total: number;
  synced: number;
  stillPending: number;
  failed: number;
  details: Array<{
    loanNumber: string;
    status: 'synced' | 'still_pending' | 'failed';
    accountNumber?: string;
    reason?: string;
  }>;
}

export default function MissingVirtualAccountsPage() {
  const queryClient = useQueryClient();
  const [showMissingDetails, setShowMissingDetails] = useState(false);
  const [showPendingDetails, setShowPendingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'missing' | 'pending'>('pending');

  const { data: missingLoans, isLoading: loadingMissing, error: errorMissing, refetch: refetchMissing } = useQuery<LoanWithoutVA[]>({
    queryKey: ['missing-virtual-accounts'],
    queryFn: async () => {
      const response = await api.get('/virtual-accounts/missing/list');
      return response.data;
    },
  });

  const { data: pendingAccounts, isLoading: loadingPending, error: errorPending, refetch: refetchPending } = useQuery<PendingVA[]>({
    queryKey: ['pending-virtual-accounts'],
    queryFn: async () => {
      const response = await api.get('/virtual-accounts/pending/list');
      return response.data;
    },
  });

  const bulkCreateMutation = useMutation<BulkCreateResult>({
    mutationFn: async () => {
      const response = await api.post('/virtual-accounts/missing/create-all');
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missing-virtual-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['pending-virtual-accounts'] });
      toast.success('Bulk creation completed');
    },
  });

  const bulkSyncMutation = useMutation<BulkSyncResult>({
    mutationFn: async () => {
      const response = await api.post('/virtual-accounts/pending/sync-all');
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-virtual-accounts'] });
      toast.success('Bulk sync completed');
    },
  });

  const handleBulkCreate = () => {
    if (window.confirm(`Create virtual accounts for ${missingLoans?.length || 0} loans?`)) {
      bulkCreateMutation.mutate();
    }
  };

  const handleBulkSync = () => {
    if (window.confirm(`Sync ${pendingAccounts?.length || 0} pending virtual accounts with Paystack?`)) {
      bulkSyncMutation.mutate();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Virtual Account Issues</h1>
        <p className="text-gray-600">
          Manage disbursed loans with missing or pending virtual accounts
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('missing')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'missing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <XCircle className="h-4 w-4 inline mr-2" />
          Missing ({missingLoans?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="h-4 w-4 inline mr-2" />
          Pending ({pendingAccounts?.length || 0})
        </button>
      </div>

      {/* Missing Tab */}
      {activeTab === 'missing' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold">Missing Virtual Accounts</h2>
            </div>
            <div className="card-body">
              {loadingMissing ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-600">Loading...</p>
                </div>
              ) : errorMissing ? (
                <div className="bg-red-50 border border-red-200 rounded p-4 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    Failed to load: {errorMissing instanceof Error ? errorMissing.message : 'Unknown error'}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-3xl font-bold text-red-900">{missingLoans?.length || 0}</div>
                      <div className="text-sm text-red-700">Total Missing</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-3xl font-bold text-blue-900">
                        {missingLoans?.filter(l => l.hasBankAccount).length || 0}
                      </div>
                      <div className="text-sm text-blue-700">Ready to Create</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="text-3xl font-bold text-amber-900">
                        {missingLoans?.filter(l => !l.hasBankAccount).length || 0}
                      </div>
                      <div className="text-sm text-amber-700">Missing Bank Details</div>
                    </div>
                  </div>

                  {missingLoans && missingLoans.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                          Virtual account creation failed during disbursement. Create them now to enable repayment collection.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleBulkCreate}
                          disabled={bulkCreateMutation.isPending || !missingLoans.some(l => l.hasBankAccount)}
                          className="btn-primary disabled:opacity-50"
                        >
                          {bulkCreateMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>Create All ({missingLoans.filter(l => l.hasBankAccount).length})</>
                          )}
                        </button>

                        <button onClick={() => refetchMissing()} className="btn-secondary">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </button>

                        <button onClick={() => setShowMissingDetails(!showMissingDetails)} className="btn-secondary">
                          {showMissingDetails ? 'Hide Details' : 'Show Details'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-green-800">
                        All disbursed loans have virtual accounts!
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Results */}
          {bulkCreateMutation.data && (
            <div className="card border-blue-200 bg-blue-50">
              <div className="card-header">
                <h3 className="font-semibold text-blue-900">Creation Results</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{bulkCreateMutation.data.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{bulkCreateMutation.data.created}</div>
                    <div className="text-sm text-gray-600">Created</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">{bulkCreateMutation.data.skipped}</div>
                    <div className="text-sm text-gray-600">Skipped</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{bulkCreateMutation.data.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Pending Virtual Accounts</h2>
            </div>
            <div className="card-body">
              {loadingPending ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-600">Loading...</p>
                </div>
              ) : errorPending ? (
                <div className="bg-red-50 border border-red-200 rounded p-4 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    Failed to load: {errorPending instanceof Error ? errorPending.message : 'Unknown error'}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="text-3xl font-bold text-amber-900">{pendingAccounts?.length || 0}</div>
                      <div className="text-sm text-amber-700">Total Pending</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-3xl font-bold text-red-900">
                        {pendingAccounts?.filter(a => a.daysPending > 2).length || 0}
                      </div>
                      <div className="text-sm text-red-700">Stuck (&gt;2 days)</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-3xl font-bold text-blue-900">
                        {pendingAccounts?.filter(a => a.daysPending <= 2).length || 0}
                      </div>
                      <div className="text-sm text-blue-700">Recent (≤2 days)</div>
                    </div>
                  </div>

                  {pendingAccounts && pendingAccounts.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-start gap-2">
                        <Clock className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                          These virtual accounts were created but Paystack hasn't assigned account numbers yet. 
                          This usually takes a few minutes but can take up to 24 hours. Sync with Paystack to check for updates.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleBulkSync}
                          disabled={bulkSyncMutation.isPending}
                          className="btn-primary disabled:opacity-50"
                        >
                          {bulkSyncMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>Sync All with Paystack</>
                          )}
                        </button>

                        <button onClick={() => refetchPending()} className="btn-secondary">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </button>

                        <button onClick={() => setShowPendingDetails(!showPendingDetails)} className="btn-secondary">
                          {showPendingDetails ? 'Hide Details' : 'Show Details'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-green-800">
                        No pending virtual accounts. All accounts have been assigned!
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Results */}
          {bulkSyncMutation.data && (
            <div className="card border-blue-200 bg-blue-50">
              <div className="card-header">
                <h3 className="font-semibold text-blue-900">Sync Results</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{bulkSyncMutation.data.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{bulkSyncMutation.data.synced}</div>
                    <div className="text-sm text-gray-600">Synced</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">{bulkSyncMutation.data.stillPending}</div>
                    <div className="text-sm text-gray-600">Still Pending</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{bulkSyncMutation.data.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
