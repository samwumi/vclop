import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Plus, Eye } from 'lucide-react';
import { staffLoansService, type StaffLoanStatus } from '@/services/staff-loans.service';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_CONFIG: Record<StaffLoanStatus, { label: string; variant: 'gray' | 'yellow' | 'blue' | 'green' | 'red' }> = {
  DRAFT: { label: 'Draft', variant: 'gray' },
  PENDING_APPROVAL: { label: 'Pending', variant: 'yellow' },
  APPROVED: { label: 'Approved', variant: 'blue' },
  REJECTED: { label: 'Rejected', variant: 'red' },
  DISBURSED: { label: 'Disbursed', variant: 'blue' },
  ACTIVE: { label: 'Active', variant: 'green' },
  FULLY_PAID: { label: 'Paid', variant: 'green' },
  DEFAULTED: { label: 'Defaulted', variant: 'red' },
};

export function MyStaffLoansPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StaffLoanStatus | ''>('');

  const { data: loans, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-staff-loans', statusFilter],
    queryFn: () => staffLoansService.getMyLoans(statusFilter || undefined),
  });

  const activeLoan = loans?.find(l => ['ACTIVE', 'DISBURSED'].includes(l.status));
  const pendingLoan = loans?.find(l => l.status === 'PENDING_APPROVAL');
  const canApply = !activeLoan && !pendingLoan;

  return (
    <ModulePage
      title="My Staff Loans"
      subtitle="View and manage your loan applications"
      icon={DollarSign}
      search={search}
      onSearchChange={setSearch}
      filter={
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value as StaffLoanStatus | '')}
          className="input w-40"
        >
          <option value="">All Status</option>
          <option value="PENDING_APPROVAL">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="ACTIVE">Active</option>
          <option value="FULLY_PAID">Paid</option>
          <option value="REJECTED">Rejected</option>
        </select>
      }
      actions={[
        { 
          label: 'Apply for Loan', 
          icon: Plus, 
          onClick: () => navigate('/hr/staff-loans/apply'), 
          variant: 'primary', 
          permission: canApply 
        },
      ]}
      columns={[
        { key: 'loanId', label: 'Loan ID' },
        { key: 'amount', label: 'Amount' },
        { key: 'purpose', label: 'Purpose' },
        { key: 'monthly', label: 'Monthly' },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date' },
        { key: 'actions', label: 'Actions' },
      ]}
      isLoading={isLoading}
      isEmpty={!isLoading && (loans?.length ?? 0) === 0}
      isError={isError}
      error={error as Error}
      onRetry={refetch}
      emptyIcon={DollarSign}
      emptyTitle="No loans found"
      emptyDescription={canApply ? "Apply for your first staff loan" : "You can only have one active loan at a time"}
      rows={
        <>
          {loans?.map((loan) => {
            const status = STATUS_CONFIG[loan.status] ?? { label: loan.status, variant: 'gray' as const };
            return (
              <tr key={loan.id} className="cursor-pointer" onClick={() => navigate(`/hr/staff-loans/${loan.id}`)}>
                <td className="text-xs font-mono text-gray-600">{loan.id.slice(0, 8)}</td>
                <td className="font-semibold">{formatCurrency(loan.principalAmount)}</td>
                <td className="text-sm text-gray-700">{loan.purpose}</td>
                <td className="text-sm">{formatCurrency(loan.monthlyInstallment)}</td>
                <td><Badge variant={status.variant}>{status.label}</Badge></td>
                <td className="text-xs text-gray-500">{formatDate(loan.createdAt)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button className="btn-ghost btn-icon w-7 h-7" onClick={() => navigate(`/hr/staff-loans/${loan.id}`)}>
                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </td>
              </tr>
            );
          })}
        </>
      }
    />
  );
}
