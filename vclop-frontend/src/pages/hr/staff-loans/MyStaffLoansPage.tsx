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
  const [search, setSearch] = useState('');

  const { data: loans, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-staff-loans', statusFilter],
    queryFn: () => staffLoansService.getMyLoans(statusFilter || undefined),
  });

  // Check eligibility
  const { data: eligibility } = useQuery({
    queryKey: ['staff-loan-eligibility'],
    queryFn: () => staffLoansService.checkEligibility(),
  });

  const activeLoan = loans?.find(l => ['ACTIVE', 'DISBURSED'].includes(l.status));
  const pendingLoan = loans?.find(l => l.status === 'PENDING_APPROVAL');
  const canApply = !activeLoan && !pendingLoan && eligibility?.eligible;

  const hasEligibilityIssues = eligibility && !eligibility.eligible;
  const missingEmployment = hasEligibilityIssues && !eligibility?.reasons?.activeEmployment;
  const missingSalary = hasEligibilityIssues && eligibility?.reasons?.activeEmployment && !eligibility?.reasons?.hasValidSalary;

  return (
    <div>
      {/* Eligibility Warning Banner */}
      {missingEmployment && (
        <div className="container mx-auto mb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">⚠️ Employment Record Required</h3>
                <p className="text-sm text-yellow-800 mb-3">
                  You need an employment record to apply for staff loans. This record contains your salary information used to determine loan eligibility.
                </p>
                <div className="flex flex-wrap gap-2">
                  <p className="text-sm font-medium text-yellow-900">What to do:</p>
                  <p className="text-sm text-yellow-800">Contact HR Department (hr@company.com) to create your employment record.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {missingSalary && (
        <div className="container mx-auto mb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">⚠️ Salary Information Required</h3>
                <p className="text-sm text-yellow-800 mb-3">
                  Your employment record exists but doesn't have salary information. Salary is required to calculate your loan eligibility.
                </p>
                <div className="flex flex-wrap gap-2">
                  <p className="text-sm font-medium text-yellow-900">What to do:</p>
                  <p className="text-sm text-yellow-800">Contact HR Department to update your employment record with your monthly salary.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModulePage
      title="My Staff Loans"
      subtitle="View and manage your loan applications"
      icon={DollarSign}
      search={search}
      onSearchChange={setSearch}
      filters={
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
    </div>
  );
}
