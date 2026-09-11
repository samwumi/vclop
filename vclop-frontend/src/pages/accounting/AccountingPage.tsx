import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, Car, CheckCircle2, Eye, Send, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { loansService } from '@/services/loans.service';
import { transportService } from '@/services/transport.service';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import type { LoanApplication } from '@/types/domain.types';

type ActiveTab = 'loans' | 'transport';

export function AccountingPage() {
  const [tab, setTab] = useState<ActiveTab>('loans');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission } = useAuthStore();

  const canDisburse = hasPermission('loan_applications:disburse_head') || hasPermission('system:admin');
  const canPayTransport = hasPermission('loan_applications:disburse_head') || hasPermission('system:admin');

  // ── Loans ─────────────────────────────────────────────────────────────────
  const loansQuery = useQuery({
    queryKey: ['accounting-disbursements', { page, search }],
    queryFn: () => loansService.list({ page, limit: 25, search, status: 'APPROVED' }),
    placeholderData: (prev) => prev,
    enabled: tab === 'loans',
  });

  const disburseMutation = useMutation({
    mutationFn: loansService.disburse,
    onSuccess: () => {
      toast.success('Loan disbursed successfully');
      qc.invalidateQueries({ queryKey: ['accounting-disbursements'] });
      qc.invalidateQueries({ queryKey: ['loans'] });
    },
    onError: (e: unknown) =>
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Unable to disburse this loan',
      ),
  });

  // ── Transport ─────────────────────────────────────────────────────────────
  const transportQuery = useQuery({
    queryKey: ['accounting-transport'],
    queryFn: () => transportService.list('APPROVED'),
    enabled: tab === 'transport',
    placeholderData: (prev) => prev,
  });

  const payMutation = useMutation({
    mutationFn: transportService.markPaid,
    onSuccess: () => {
      toast.success('Transport allowance paid');
      qc.invalidateQueries({ queryKey: ['accounting-transport'] });
      qc.invalidateQueries({ queryKey: ['transport-requests'] });
    },
    onError: () => toast.error('Failed to mark as paid'),
  });

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Banknote className="w-5 h-5 text-gray-600" /> Accounting
          </h1>
          <p className="page-description">Loan disbursements and transport allowance payments.</p>
        </div>
        <button
          onClick={() => navigate('/accounting/reconciliation')}
          className="btn-secondary flex items-center gap-2"
        >
          <Scale className="w-4 h-4" />
          Reconciliation
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('loans')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'loans' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Banknote className="w-3.5 h-3.5" /> Loan Disbursements
          {(loansQuery.data?.data?.length ?? 0) > 0 && (
            <span className="min-w-[18px] h-[18px] rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
              {loansQuery.data!.data.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('transport')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'transport' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Car className="w-3.5 h-3.5" /> Transport Allowances
          {(transportQuery.data?.length ?? 0) > 0 && (
            <span className="min-w-[18px] h-[18px] rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
              {transportQuery.data!.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Loan Disbursements ─────────────────────────────────────────────── */}
      {tab === 'loans' && (
        <ModulePage
          title=""
          subtitle=""
          icon={Banknote}
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          columns={[
            { key: 'ref',      label: 'Application #' },
            { key: 'customer', label: 'Customer' },
            { key: 'product',  label: 'Product' },
            { key: 'amount',   label: 'Amount',   width: '150px' },
            { key: 'approved', label: 'Approved', width: '130px' },
            { key: 'action',   label: '',         width: '190px' },
          ]}
          rows={
            <>
              {loansQuery.data?.data.map((application: LoanApplication) => (
                <tr key={application.id}>
                  <td className="font-mono text-xs font-semibold text-brand-600">{application.applicationNumber}</td>
                  <td className="text-sm font-medium text-gray-800">
                    {application.customer ? `${application.customer.firstName} ${application.customer.lastName}` : '—'}
                  </td>
                  <td className="text-sm text-gray-600">{application.loanProduct?.name ?? '—'}</td>
                  <td className="font-medium">₦{Number(application.amount).toLocaleString()}</td>
                  <td className="text-xs text-gray-500">{formatDate(application.reviewedAt)}</td>
                  <td className="flex gap-2 py-2">
                    <button
                      onClick={() => navigate(`/loans/${application.id}`)}
                      className="btn-secondary btn-sm gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {canDisburse && (
                      <button
                        onClick={() => disburseMutation.mutate(application.id)}
                        disabled={disburseMutation.isPending}
                        className="btn-primary btn-sm gap-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" /> Disburse
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </>
          }
          isLoading={loansQuery.isLoading}
          isEmpty={!loansQuery.isLoading && (loansQuery.data?.data.length ?? 0) === 0}
          emptyIcon={Banknote}
          emptyTitle="No loans awaiting disbursement"
          emptyDescription="Applications approved by Internal Control will appear here."
          meta={loansQuery.data?.meta}
          onPageChange={setPage}
        />
      )}

      {/* ── Transport Allowances ───────────────────────────────────────────── */}
      {tab === 'transport' && (
        <ModulePage
          title=""
          subtitle=""
          icon={Car}
          search=""
          onSearchChange={() => {}}
          columns={[
            { key: 'officer',   label: 'Officer' },
            { key: 'location',  label: 'Location' },
            { key: 'purpose',   label: 'Purpose' },
            { key: 'customers', label: '# Customers', width: '110px' },
            { key: 'amount',    label: 'Approved Amount', width: '150px' },
            { key: 'approved',  label: 'Approved',        width: '120px' },
            { key: 'action',    label: '',                width: '120px' },
          ]}
          rows={
            <>
              {(transportQuery.data ?? []).map((req) => (
                <tr key={req.id}>
                  <td className="text-sm font-medium text-gray-800">
                    {req.requestedBy
                      ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}`
                      : '—'}
                  </td>
                  <td className="text-xs text-gray-600">{req.location}</td>
                  <td className="text-xs text-gray-600 max-w-[200px] truncate" title={req.purpose}>
                    {req.purpose}
                  </td>
                  <td className="text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-50 text-brand-700 text-xs font-bold">
                      {req.customerCount ?? 1}
                    </span>
                  </td>
                  <td className="font-medium">
                    ₦{Number(req.approvedAmount ?? req.suggestedAmount ?? 0).toLocaleString()}
                  </td>
                  <td className="text-xs text-gray-500">
                    {req.reviewedAt ? formatDate(req.reviewedAt) : '—'}
                    {req.reviewedBy && (
                      <p className="text-gray-400">by {req.reviewedBy.firstName} {req.reviewedBy.lastName}</p>
                    )}
                  </td>
                  <td>
                    {canPayTransport ? (
                      <button
                        onClick={() => payMutation.mutate(req.id)}
                        disabled={payMutation.isPending}
                        className="btn-primary btn-sm gap-1 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pay
                      </button>
                    ) : (
                      <Badge variant="blue">Approved</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </>
          }
          isLoading={transportQuery.isLoading}
          isEmpty={!transportQuery.isLoading && (transportQuery.data?.length ?? 0) === 0}
          emptyIcon={Car}
          emptyTitle="No transport requests awaiting payment"
          emptyDescription="Transport requests approved by Internal Control will appear here."
        />
      )}
    </div>
  );
}
