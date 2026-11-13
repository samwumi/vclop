import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Plus, Eye, XCircle } from 'lucide-react';
import { leavesService, type LeaveStatus } from '@/services/leaves.service';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

const STATUS_CONFIG: Record<LeaveStatus, { label: string; variant: 'gray' | 'yellow' | 'blue' | 'green' | 'red' }> = {
  DRAFT: { label: 'Draft', variant: 'gray' },
  PENDING_APPROVAL: { label: 'Pending', variant: 'yellow' },
  APPROVED: { label: 'Approved', variant: 'blue' },
  REJECTED: { label: 'Rejected', variant: 'red' },
  ACTIVE: { label: 'Active', variant: 'green' },
  COMPLETED: { label: 'Completed', variant: 'gray' },
  CANCELLED: { label: 'Cancelled', variant: 'red' },
};

export function MyLeavesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | ''>('');
  const [search, setSearch] = useState('');
  const currentYear = new Date().getFullYear();

  const { data: applications, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-leave-applications', statusFilter],
    queryFn: () => leavesService.getMyApplications(statusFilter || undefined),
  });

  const { data: balances } = useQuery({
    queryKey: ['my-leave-balances', currentYear],
    queryFn: () => leavesService.getMyBalance(currentYear),
  });

  const balanceArray = Array.isArray(balances) ? balances : [];

  const filteredApplications = applications?.filter(app => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      app.applicationNumber.toLowerCase().includes(searchLower) ||
      app.leaveType.name.toLowerCase().includes(searchLower) ||
      app.reason.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Leave Balance Cards */}
      {balanceArray.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {balanceArray.map((balance) => (
            <div key={balance.leaveType.id} className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-sm text-gray-600 mb-3">
                {balance.leaveType.name}
              </h3>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-bold text-brand-600">{balance.remaining}</p>
                  <p className="text-xs text-gray-500">days remaining</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>Total: {balance.totalAvailable}</p>
                  <p>Used: {balance.used}</p>
                  <p>Pending: {balance.pending}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModulePage
        title="My Leave Applications"
        subtitle="View and manage your leave requests"
        icon={Calendar}
        search={search}
        onSearchChange={setSearch}
        filters={
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as LeaveStatus | '')}
            className="input w-40"
          >
            <option value="">All Status</option>
            <option value="PENDING_APPROVAL">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        }
        actions={[
          { 
            label: 'Apply for Leave', 
            icon: Plus, 
            onClick: () => navigate('/hr/leaves/apply'), 
            variant: 'primary',
            permission: true
          },
        ]}
        columns={[
          { key: 'appNumber', label: 'Application #' },
          { key: 'leaveType', label: 'Leave Type' },
          { key: 'period', label: 'Period' },
          { key: 'days', label: 'Days' },
          { key: 'status', label: 'Status' },
          { key: 'submittedAt', label: 'Submitted' },
          { key: 'actions', label: 'Actions' },
        ]}
        isLoading={isLoading}
        isEmpty={!isLoading && (filteredApplications?.length ?? 0) === 0}
        isError={isError}
        error={error as Error}
        onRetry={refetch}
        emptyIcon={Calendar}
        emptyTitle="No leave applications"
        emptyDescription="You haven't applied for any leave yet"
        rows={
          <>
            {filteredApplications?.map((app) => {
              const status = STATUS_CONFIG[app.status];
              const canCancel = ['PENDING_APPROVAL', 'APPROVED'].includes(app.status);

              return (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">{app.applicationNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">{app.leaveType.name}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>{formatDate(app.startDate)}</div>
                    <div className="text-gray-500">to {formatDate(app.endDate)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">{app.businessDays}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {app.submittedAt ? formatDate(app.submittedAt) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/hr/leaves/${app.id}`)}
                        className="btn-icon"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canCancel && (
                        <button
                          onClick={() => navigate(`/hr/leaves/${app.id}/cancel`)}
                          className="btn-icon text-red-600 hover:bg-red-50"
                          title="Cancel Application"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
