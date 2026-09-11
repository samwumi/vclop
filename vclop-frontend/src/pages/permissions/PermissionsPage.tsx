import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Key } from 'lucide-react';
import { api } from '@/lib/axios';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import type { ApiResponse, PaginationMeta } from '@/types/api.types';
import type { Permission } from '@/types/domain.types';

interface PermResponse { data: Permission[]; meta: PaginationMeta; }

const CATEGORY_COLOR: Record<string, 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'gray'> = {
  USER_MANAGEMENT:       'blue',
  ROLE_MANAGEMENT:       'purple',
  PERMISSION_MANAGEMENT: 'red',
  BRANCH_MANAGEMENT:     'green',
  DEPARTMENT_MANAGEMENT: 'green',
  SETTINGS_MANAGEMENT:   'yellow',
  AUDIT_MANAGEMENT:      'gray',
  DASHBOARD_MANAGEMENT:  'blue',
  SYSTEM_ADMINISTRATION: 'red',
};

export function PermissionsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['permissions', { page, search }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search) params.set('search', search);
      const { data } = await api.get<ApiResponse<PermResponse>>(`/permissions?${params}`);
      return data.data!;
    },
    placeholderData: (prev) => prev,
  });

  const COLUMNS = [
    { key: 'code',     label: 'Code' },
    { key: 'name',     label: 'Name' },
    { key: 'category', label: 'Category', width: '200px' },
    { key: 'module',   label: 'Module',   width: '120px' },
    { key: 'action',   label: 'Action',   width: '120px' },
  ];

  return (
    <ModulePage
      title="Permissions"
      subtitle="System permission catalog — read-only reference"
      icon={Key}
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(1); }}
      columns={COLUMNS}
      isLoading={isLoading}
      isEmpty={!isLoading && (data?.data?.length ?? 0) === 0}
      meta={data?.meta}
      onPageChange={setPage}
      rows={
        <>
          {data?.data?.map((perm) => (
            <tr key={perm.id}>
              <td><code className="text-xs text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">{perm.code}</code></td>
              <td className="text-sm text-gray-700">{perm.name}</td>
              <td>
                <Badge variant={CATEGORY_COLOR[perm.category] ?? 'gray'} className="text-xs">
                  {perm.category.replace(/_/g, ' ')}
                </Badge>
              </td>
              <td className="text-xs text-gray-500">{perm.module}</td>
              <td className="text-xs text-gray-500">{perm.action}</td>
            </tr>
          ))}
        </>
      }
    />
  );
}
