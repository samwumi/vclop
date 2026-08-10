import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';
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

const STATUS_OPTS: LoanApplicationStatus[] = [
  'DRAFT', 'SUBMITTED', 'COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW',
  'ACCOUNTING_REVIEW', 'APPROVED', 'DISBURSED', 'REJECTED', 'RETURNED', 'CANCELLED',
];

export function LoansPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<LoanApplicationStatus | ''>('');
  const { hasPermission, user } = useAuthStore();
  const navigate = useNavigate();

  // Loan officers see only their own submissions — the backend enforces this too,
  // but we make it explicit here so the UI title and description are accurate.
  const isLoanOfficer =
    !hasPermission('system:admin') &&
    !hasPermission('loan_applications:compliance_review') &&
    !hasPermission('loan_applications:disburse');

  const { data, isLoading } = useQuery({
    queryKey: ['loans', { page, search, status, userId: isLoanOfficer ? user?.id : undefined }],
    queryFn: () =>
      loansService.list({
        page,
        limit: 25,
        search,
        ...(status ? { status } : {}),
        // backend auto-scopes loan officers, but we pass it explicitly for cache isolation
        ...(isLoanOfficer && user ? { submittedById: user.id } : {}),
      }),
    placeholderData: (prev) => prev,
  });

  const COLUMNS = [
    { key: 'appNo',    label: 'Application #' },
    { key: 'customer', label: 'Customer' },
    { key: 'product',  label: 'Product',  width: '150px' },
    { key: 'amount',   label: 'Amount',   width: '140px' },
    { key: 'status',   label: 'Status',   width: '130px' },
    { key: 'date',     label: 'Date',     width: '110px' },
  ];

  return (
    <ModulePage
      title={isLoanOfficer ? 'My Applications' : 'Loan Applications'}
      subtitle={
        isLoanOfficer
          ? 'Applications you have submitted'
          : 'All applications — origination, review, and disbursement'
      }
      icon={FileText}
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(1); }}
      actions={[
        {
          label: 'Export CSV',
          icon: Download,
          onClick: () => {
            loansService.exportCsv({ status: status || undefined, search }).catch(() =>
              toast.error('Export failed — please try again'),
            );
          },
          permission: true,
        },
        {
          label: 'New Application',
          icon: Plus,
          onClick: () => navigate('/loans/new'),
          variant: 'primary',
          permission: hasPermission('loan_applications:create'),
        },
      ]}
      columns={COLUMNS}
      isLoading={isLoading}
      isEmpty={!isLoading && (data?.data?.length ?? 0) === 0}
      emptyIcon={FileText}
      emptyTitle={isLoanOfficer ? 'No applications yet' : 'No loan applications'}
      emptyDescription={
        isLoanOfficer
          ? 'Start by registering a customer and creating a loan application.'
          : 'Create the first loan application to get started.'
      }
      meta={data?.meta}
      onPageChange={setPage}
      filters={
        <select
          className="form-input h-9 text-sm w-44"
          value={status}
          onChange={(e) => { setStatus(e.target.value as LoanApplicationStatus | ''); setPage(1); }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      }
      rows={
        <>
          {data?.data?.map((loan: LoanApplication) => (
            <tr key={loan.id} className="cursor-pointer" onClick={() => navigate(`/loans/${loan.id}`)}>
              <td className="font-mono text-xs text-brand-600 font-semibold">{loan.applicationNumber}</td>
              <td>
                <p className="text-sm font-medium text-gray-800">
                  {loan.customer
                    ? `${loan.customer.firstName} ${loan.customer.lastName}`
                    : '—'}
                </p>
                <p className="text-xs text-gray-400">{loan.customer?.customerNumber ?? ''}</p>
              </td>
              <td className="text-xs text-gray-600">{loan.loanProduct?.name ?? '—'}</td>
              <td className="text-sm font-medium">₦{Number(loan.amount).toLocaleString()}</td>
              <td>
                <Badge variant={STATUS_VARIANT[loan.status] ?? 'gray'}>
                  {loan.status.replace(/_/g, ' ')}
                </Badge>
              </td>
              <td className="text-xs text-gray-500">{formatDate(loan.createdAt)}</td>
            </tr>
          ))}
        </>
      }
    />
  );
}
