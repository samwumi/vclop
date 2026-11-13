import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Plus, Eye } from 'lucide-react';
import { offboardingService, type OffboardingStatus } from '@/services/offboarding.service';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const STATUS_CONFIG: Record<OffboardingStatus, { label: string; variant: 'gray' | 'yellow' | 'blue' | 'green' | 'red' }> = {
  INITIATED: { label: 'Initiated', variant: 'gray' },
  IT_ACCESS_REVOKED: { label: 'IT Revoked', variant: 'yellow' },
  FINANCE_CLEARED: { label: 'Finance Cleared', variant: 'yellow' },
  ASSETS_CLEARED: { label: 'Assets Cleared', variant: 'yellow' },
  HR_CLEARED: { label: 'HR Cleared', variant: 'blue' },
  COMPLETED: { label: 'Completed', variant: 'green' },
  ON_HOLD: { label: 'On Hold', variant: 'red' },
};

export function OffboardingManagementPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<OffboardingStatus | ''>('');
  const [search, setSearch] = useState('');
  const [showInitiateModal, setShowInitiateModal] = useState(false);

  const { data: cases, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['offboarding-cases', statusFilter],
    queryFn: () => offboardingService.getOffboardingCases(statusFilter || undefined),
  });

  const filteredCases = cases?.filter(c => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      c.user.firstName.toLowerCase().includes(searchLower) ||
      c.user.lastName.toLowerCase().includes(searchLower) ||
      c.user.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Cases</p>
            <LogOut className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold">{cases?.length || 0}</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-yellow-700">In Progress</p>
            <LogOut className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-900">
            {cases?.filter(c => !['COMPLETED', 'ON_HOLD'].includes(c.status)).length || 0}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700">Completed</p>
            <LogOut className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-900">
            {cases?.filter(c => c.status === 'COMPLETED').length || 0}
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-red-700">On Hold</p>
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-900">
            {cases?.filter(c => c.status === 'ON_HOLD').length || 0}
          </p>
        </div>
      </div>

      <ModulePage
        title="Offboarding Management"
        subtitle="Manage employee exit processes"
        icon={LogOut}
        search={search}
        onSearchChange={setSearch}
        filters={
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as OffboardingStatus | '')}
            className="input w-48"
          >
            <option value="">All Status</option>
            <option value="INITIATED">Initiated</option>
            <option value="IT_ACCESS_REVOKED">IT Revoked</option>
            <option value="FINANCE_CLEARED">Finance Cleared</option>
            <option value="ASSETS_CLEARED">Assets Cleared</option>
            <option value="HR_CLEARED">HR Cleared</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        }
        actions={[
          { 
            label: 'Initiate Offboarding', 
            icon: Plus, 
            onClick: () => setShowInitiateModal(true), 
            variant: 'primary',
            permission: true
          },
        ]}
        columns={[
          { key: 'employee', label: 'Employee' },
          { key: 'exitReason', label: 'Exit Reason' },
          { key: 'lastWorkingDate', label: 'Last Working Date' },
          { key: 'status', label: 'Status' },
          { key: 'initiated', label: 'Initiated' },
          { key: 'progress', label: 'Progress' },
          { key: 'actions', label: 'Actions' },
        ]}
        isLoading={isLoading}
        isEmpty={!isLoading && (filteredCases?.length ?? 0) === 0}
        isError={isError}
        error={error as Error}
        onRetry={refetch}
        emptyIcon={LogOut}
        emptyTitle="No offboarding cases"
        emptyDescription="No employee offboarding processes found"
        rows={
          <>
            {filteredCases?.map((c) => {
              const status = STATUS_CONFIG[c.status];
              const completedSteps = [
                c.itAccessRevokedAt,
                c.financeClearedAt,
                c.assetsClearedAt,
                c.hrClearedAt,
              ].filter(Boolean).length;

              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{c.user.firstName} {c.user.lastName}</p>
                      <p className="text-sm text-gray-500">{c.user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{c.exitReason.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatDate(c.lastWorkingDate)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(c.initiatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-500"
                          style={{ width: `${(completedSteps / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{completedSteps}/4</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/hr/offboarding/${c.id}`)}
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
