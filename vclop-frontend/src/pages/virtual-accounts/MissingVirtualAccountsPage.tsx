import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, XCircle, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

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
    },
  });

  const bulkSyncMutation = useMutation<BulkSyncResult>({
    mutationFn: async () => {
      const response = await api.post('/virtual-accounts/pending/sync-all');
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-virtual-accounts'] });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Virtual Account Issues</h1>
        <p className="text-gray-600">
          Manage disbursed loans with missing or pending virtual accounts
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="missing" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Missing ({missingLoans?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingAccounts?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Missing Virtual Accounts Tab */}
        <TabsContent value="missing">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Missing Virtual Accounts
              </CardTitle>
              <CardDescription>
                Loans that were disbursed but virtual account creation failed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMissing ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-600">Loading...</p>
                </div>
              ) : errorMissing ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load: {errorMissing instanceof Error ? errorMissing.message : 'Unknown error'}
                  </AlertDescription>
                </Alert>
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
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Virtual account creation failed during disbursement. Create them now to enable repayment collection.
                        </AlertDescription>
                      </Alert>

                      <div className="flex gap-3">
                        <Button
                          onClick={handleBulkCreate}
                          disabled={bulkCreateMutation.isPending || !missingLoans.some(l => l.hasBankAccount)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {bulkCreateMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>Create All ({missingLoans.filter(l => l.hasBankAccount).length})</>
                          )}
                        </Button>

                        <Button onClick={() => refetchMissing()} variant="outline">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>

                        <Button onClick={() => setShowMissingDetails(!showMissingDetails)} variant="outline">
                          {showMissingDetails ? 'Hide Details' : 'Show Details'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        All disbursed loans have virtual accounts!
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {bulkCreateMutation.data && (
            <BulkCreateResultCard result={bulkCreateMutation.data} />
          )}

          {showMissingDetails && missingLoans && missingLoans.length > 0 && (
            <LoanListCard loans={missingLoans} formatCurrency={formatCurrency} formatDate={formatDate} />
          )}
        </TabsContent>

        {/* Pending Virtual Accounts Tab */}
        <TabsContent value="pending">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Pending Virtual Accounts
              </CardTitle>
              <CardDescription>
                Accounts waiting for Paystack to assign account numbers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-600">Loading...</p>
                </div>
              ) : errorPending ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load: {errorPending instanceof Error ? errorPending.message : 'Unknown error'}
                  </AlertDescription>
                </Alert>
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
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          These virtual accounts were created but Paystack hasn't assigned account numbers yet. 
                          This usually takes a few minutes but can take up to 24 hours. Sync with Paystack to check for updates.
                        </AlertDescription>
                      </Alert>

                      <div className="flex gap-3">
                        <Button
                          onClick={handleBulkSync}
                          disabled={bulkSyncMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {bulkSyncMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Syncing with Paystack...
                            </>
                          ) : (
                            <>Sync All with Paystack</>
                          )}
                        </Button>

                        <Button onClick={() => refetchPending()} variant="outline">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>

                        <Button onClick={() => setShowPendingDetails(!showPendingDetails)} variant="outline">
                          {showPendingDetails ? 'Hide Details' : 'Show Details'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        No pending virtual accounts. All accounts have been assigned!
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {bulkSyncMutation.data && (
            <BulkSyncResultCard result={bulkSyncMutation.data} />
          )}

          {showPendingDetails && pendingAccounts && pendingAccounts.length > 0 && (
            <PendingAccountsListCard accounts={pendingAccounts} formatCurrency={formatCurrency} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper components
function BulkCreateResultCard({ result }: { result: BulkCreateResult }) {
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
          Creation Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">{result.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{result.created}</div>
            <div className="text-sm text-gray-600">Created</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{result.skipped}</div>
            <div className="text-sm text-gray-600">Skipped</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{result.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-blue-700 hover:text-blue-800">
            View details
          </summary>
          <div className="mt-3 space-y-2">
            {result.details.map((detail, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                <span className="font-mono text-sm">{detail.loanNumber}</span>
                <div className="flex items-center gap-2">
                  {detail.status === 'created' && <Badge className="bg-green-100 text-green-800">Created</Badge>}
                  {detail.status === 'skipped' && <Badge className="bg-amber-100 text-amber-800">Skipped</Badge>}
                  {detail.status === 'failed' && <Badge className="bg-red-100 text-red-800">Failed</Badge>}
                  {detail.reason && <span className="text-xs text-gray-600">{detail.reason}</span>}
                </div>
              </div>
            ))}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

function BulkSyncResultCard({ result }: { result: BulkSyncResult }) {
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
          Sync Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">{result.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{result.synced}</div>
            <div className="text-sm text-gray-600">Synced</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{result.stillPending}</div>
            <div className="text-sm text-gray-600">Still Pending</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{result.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-blue-700 hover:text-blue-800">
            View details
          </summary>
          <div className="mt-3 space-y-2">
            {result.details.map((detail, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                <span className="font-mono text-sm">{detail.loanNumber}</span>
                <div className="flex items-center gap-2">
                  {detail.status === 'synced' && (
                    <>
                      <Badge className="bg-green-100 text-green-800">Synced</Badge>
                      {detail.accountNumber && <span className="text-xs font-mono">{detail.accountNumber}</span>}
                    </>
                  )}
                  {detail.status === 'still_pending' && <Badge className="bg-amber-100 text-amber-800">Still Pending</Badge>}
                  {detail.status === 'failed' && <Badge className="bg-red-100 text-red-800">Failed</Badge>}
                  {detail.reason && <span className="text-xs text-gray-600">{detail.reason}</span>}
                </div>
              </div>
            ))}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

function LoanListCard({ loans, formatCurrency, formatDate }: { loans: LoanWithoutVA[]; formatCurrency: (n: number) => string; formatDate: (s: string) => string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loans.map((loan) => (
            <div key={loan.loanId} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between mb-2">
                <div>
                  <div className="font-semibold">{loan.loanNumber}</div>
                  <div className="text-sm text-gray-600">{loan.loanProduct}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(loan.principal)}</div>
                  <div className="text-xs text-gray-500">{formatDate(loan.disbursedAt)}</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {loan.customerName} • {loan.customerNumber} • {loan.customerPhone}
              </div>
              {loan.hasBankAccount ? (
                <Badge className="bg-green-100 text-green-800">Has Bank Account</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">Missing Bank Account</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PendingAccountsListCard({ accounts, formatCurrency }: { accounts: PendingVA[]; formatCurrency: (n: number) => string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.virtualAccountId} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between mb-2">
                <div>
                  <div className="font-semibold">{account.loanNumber}</div>
                  <div className="text-sm text-gray-600">{account.loanProduct}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(account.principal)}</div>
                  <Badge className={account.daysPending > 2 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>
                    {account.daysPending} {account.daysPending === 1 ? 'day' : 'days'} pending
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {account.customerName} • {account.customerNumber} • {account.customerPhone}
              </div>
              <div className="text-xs font-mono text-gray-500">{account.pendingAccountNumber}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
