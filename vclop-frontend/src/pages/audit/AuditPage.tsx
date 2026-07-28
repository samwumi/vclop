import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, Download, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/axios';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth.store';
import { formatDateTime } from '@/lib/utils';
import type { ApiResponse, PaginationMeta } from '@/types/api.types';
import type { AuditLog } from '@/types/domain.types';

interface AuditResponse { data: AuditLog[]; meta: PaginationMeta; }

const ACTION_COLORS: Record<string, 'green' | 'red' | 'blue' | 'yellow' | 'gray'> = {
  CREATE: 'green', UPDATE: 'blue', DELETE: 'red',
  LOGIN: 'green', LOGOUT: 'gray', LOGIN_FAILED: 'red',
  PASSWORD_RESET: 'yellow', PASSWORD_CHANGE: 'yellow',
};

export function AuditPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { hasPermission } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['audit', { page, search }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '25', sortBy: 'createdAt', sortOrder: 'desc' });
      if (search) params.set('search', search);
      const { data } = await api.get<ApiResponse<AuditResponse>>(`/audit?${params}`);
      return data.data!;
    },
    placeholderData: (prev) => prev,
    refetchInterval: 30_000,
  });

  const COLUMNS = [
    { key: 'user',    label: 'User' },
    { key: 'action',  label: 'Action',      width: '130px' },
    { key: 'module',  label: 'Module',      width: '120px' },
    { key: 'desc',    label: 'Description' },
    { key: 'ip',      label: 'IP',          width: '120px' },
    { key: 'status',  label: 'Status',      width: '70px' },
    { key: 'time',    label: 'Time',        width: '160px' },
  ];

  return (
    <ModulePage
      title="Audit Logs"
      subtitle="Complete audit trail of all platform activity"
      icon={ScrollText}
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(1); }}
      actions={[
        { label: 'Export', icon: Download, onClick: () => {}, permission: hasPermission('audit:export') },
      ]}
      columns={COLUMNS}
      isLoading={isLoading}
      isEmpty={!isLoading && (data?.data?.length ?? 0) === 0}
      emptyTitle="No audit records"
      emptyDescription="Activity will appear here once users interact with the platform."
      meta={data?.meta}
      onPageChange={setPage}
      rows={
        <>
          {data?.data?.map((log) => (
            <tr key={log.id}>
              <td>
                <p className="text-xs font-medium text-gray-800">
                  {log.user ? `${log.user.firstName} ${log.user.lastName}` : log.userFullName ?? 'System'}
                </p>
                <p className="text-xs text-gray-400">{log.userEmail ?? '—'}</p>
              </td>
              <td>
                <Badge variant={ACTION_COLORS[log.action] ?? 'gray'} className="text-xs">
                  {log.action.replace(/_/g, ' ')}
                </Badge>
              </td>
              <td className="text-xs text-gray-600 capitalize">{log.module}</td>
              <td className="text-xs text-gray-500 max-w-[200px] truncate">{log.description ?? '—'}</td>
              <td className="text-xs text-gray-400 font-mono">{log.ipAddress ?? '—'}</td>
              <td>
                {log.isSuccess
                  ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                  : <XCircle className="w-4 h-4 text-red-400" />}
              </td>
              <td className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
            </tr>
          ))}
        </>
      }
    />
  );
}
