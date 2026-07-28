import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { dashboardService } from '@/services/dashboard.service';
import { formatDateTime } from '@/lib/utils';
import { PageLoader } from '@/components/ui/LoadingScreen';
import type { AuditLog } from '@/types/domain.types';

export function RecentAuditTable() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'recent-audit'],
    queryFn: () => dashboardService.recentAudit(8),
    staleTime: 30_000,
  });

  return (
    <div className="card col-span-full">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
        <button
          onClick={() => navigate('/audit')}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="card-body"><PageLoader /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Description</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {(data as AuditLog[] ?? []).map((log) => (
                <tr key={log.id}>
                  <td>
                    <div>
                      <p className="font-medium text-gray-800 text-xs">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                      </p>
                      <p className="text-gray-400 text-xs">{log.user?.email ?? '—'}</p>
                    </div>
                  </td>
                  <td>
                    <span className="badge-blue text-xs">{log.action}</span>
                  </td>
                  <td className="text-xs text-gray-600 capitalize">{log.module}</td>
                  <td className="text-xs text-gray-500 max-w-[200px] truncate">{log.description ?? '—'}</td>
                  <td>
                    {log.isSuccess ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </td>
                  <td className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
