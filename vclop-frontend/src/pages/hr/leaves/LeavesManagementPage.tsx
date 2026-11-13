import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Eye, CheckCircle, XCircle } from 'lucide-react';
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

export function LeavesManagementPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | ''>('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['all-leave-applications', statusFilter],
    queryFn: () => leavesService.getAllApplications({ status: statusFilter || undefined }),
  });

  const { data: pendingApprovals } = useQuery({
    queryKey: ['pending-leave-approvals'],
    queryFn: () => leavesService.getPendingApprovals(),
  });

  const applications = data?.data || [];
  const pendingCount = pendingApprovals?.length || 0;

  const filteredApplications = applications.filter(app => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      app.applicationNumber.toLowerCase().includes(searchLower) ||
      app.leaveType.name.toLowerCase().includes(searchLower) ||
      (app.user && `${app.user.firstName} ${app.user.lastName}`.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Applications</p>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold">{applications.length}</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-yellow-700">Pending Approval</p>
            <CheckCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700">Approved</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-900">
            {applications.filter(a => a.status === 'APPROVED').length}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-700">Active</p>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {applications.filter(a => a.status === 'ACTIVE').length}
          </p>
        </div>
      </div>

      <ModulePage
        title="Leave Management"
        subtitle="Manage all employee leave applications"
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
          </select>
        }
        actions={[
          { 
            label: 'Pending Approvals', 
            icon: CheckCircle, 
            onClick: () => navigate('/hr/leaves/approvals'), 
            variant: 'secondary',
            permission: pendingCount > 0
          },
        ]}
        columns={[
          { key: 'appNumber', label: 'Application #' },
          { key: 'employee', label: 'Employee' },
          { key: 'leaveType', label: 'Leave Type' },
          { key: 'period', label: 'Period' },
          { key: 'days', label: 'Days' },
          { key: 'status', label: 'Status' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'actions', label: 'Actions' },
        ]}
        isLoading={isLoading}
        isEmpty={!isLoading && filteredApplications.length === 0}
        isError={isError}
        error={error as Error}
        onRetry={refetch}
        emptyIcon={Calendar}
        emptyTitle="No leave applications"
        emptyDescription="No employee leave applications found"
        rows={
          <>
            {filteredApplications.map((app) => {
              const status = STATUS_CONFIG[app.status];

              return (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">{app.applicationNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    {app.user ? (
                      <div>
                        <p className="font-medium">{app.user.firstName} {app.user.lastName}</p>
                        <p className="text-sm text-gray-500">{app.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
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
                    <button
                      onClick={() => navigate(`/hr/leaves/${app.id}`)}
                      className="btn-icon"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
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
