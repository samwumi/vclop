import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Plus, Download } from 'lucide-react';
import { loansService } from '@/services/loans.service';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate } from '@/lib/utils';
import type { LoanApplication, LoanApplicationStatus } from '@/types/domain.types';

const STATUS_VARIANT: Record<LoanApplicationStatus, 'green' | 'red' | 'yellow' | 'blue' | 'gray'> = {
  DRAFT: 'gray',
  SUBMITTED: 'yellow',
  COMPLIANCE_REVIEW: 'yellow',
  AWAITING_INFORMATION: 'yellow',
  INTERNAL_CONTROL_REVIEW: 'yellow',
  ACCOUNTING_REVIEW: 'blue',
  APPROVED: 'blue',
  DISBURSED: 'green',
  REJECTED: 'red',
  RETURNED: 'yellow',
  ESCALATED: 'red',
  CANCELLED: 'gray',
};

const STATUS_OPTS: LoanApplicationStatus[] = ['DRAFT', 'COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'ACCOUNTING_REVIEW', 'APPROVED', 'DISBURSED', 'REJECTED', 'RETURNED', 'CANCELLED'];

export function LoansPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<LoanApplicationStatus | ''>('');
  const { hasPermission } = useAuthStore();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['loans', { page, search, status }],
    queryFn: () => loansService.list({ page, limit: 25, search, ...(status ? { status } : {}) }),
    placeholderData: (prev) => prev,
  });

  const COLUMNS = [
    { key: 'appNo',    label: 'Application #' },
    { key: 'customer', label: 'Customer' },
    { key: 'product',  label: 'Product',      width: '150px' },
    { key: 'amount',   label: 'Amount',       width: '140px' },
    { key: 'status',   label: 'Status',       width: '120px' },
    { key: 'date',     label: 'Date',         width: '110px' },
  ];

  return (
    <ModulePage
      title="Loan Applications"
      subtitle="Origination, review, and disbursement"
      icon={FileText}
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(1); }}
      actions={[
        { label: 'Export', icon: Download, onClick: () => {}, permission: hasPermission('loan_applications:export') },
        { label: 'New Application', icon: Plus, onClick: () => navigate('/loans/new'), variant: 'primary', permission: hasPermission('loan_applications:create') },
      ]}
      columns={COLUMNS}
      isLoading={isLoading}
      isEmpty={!isLoading && (data?.data?.length ?? 0) === 0}
      emptyIcon={FileText}
      emptyTitle="No loan applications"
      emptyDescription="Create the first loan application to get started."
      meta={data?.meta}
      onPageChange={setPage}
      filters={
        <select
          className="form-input h-9 text-sm w-44"
          value={status}
          onChange={(e) => { setStatus(e.target.value as LoanApplicationStatus | ''); setPage(1); }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      }
      rows={
        <>
          {data?.data?.map((loan: LoanApplication) => (
            <tr key={loan.id} className="cursor-pointer" onClick={() => navigate(`/loans/${loan.id}`)}>
              <td className="font-mono text-xs text-brand-600 font-semibold">{loan.applicationNumber}</td>
              <td>
                <p className="text-sm font-medium text-gray-800">
                  {loan.customer ? `${loan.customer.firstName} ${loan.customer.lastName}` : '—'}
                </p>
                <p className="text-xs text-gray-400">{loan.customer?.customerNumber ?? ''}</p>
              </td>
              <td className="text-xs text-gray-600">{loan.loanProduct?.name ?? '—'}</td>
              <td className="text-sm font-medium">₦{Number(loan.amount).toLocaleString()}</td>
              <td><Badge variant={STATUS_VARIANT[loan.status] ?? 'gray'}>{loan.status}</Badge></td>
              <td className="text-xs text-gray-500">{formatDate(loan.createdAt)}</td>
            </tr>
          ))}
        </>
      }
    />
  );
}
