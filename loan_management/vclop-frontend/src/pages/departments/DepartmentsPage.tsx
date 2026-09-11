import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Building2, MoreHorizontal } from 'lucide-react';
import { api } from '@/lib/axios';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth.store';
import type { ApiResponse, PaginationMeta } from '@/types/api.types';
import type { Department } from '@/types/domain.types';

interface DeptResponse { data: Department[]; meta: PaginationMeta; }

export function DepartmentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { hasPermission } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['departments', { page, search }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search) params.set('search', search);
      const { data } = await api.get<ApiResponse<DeptResponse>>(`/departments?${params}`);
      return data.data!;
    },
    placeholderData: (prev) => prev,
  });

  const COLUMNS = [
    { key: 'dept',    label: 'Department' },
    { key: 'parent',  label: 'Parent',     width: '150px' },
    { key: 'desc',    label: 'Description' },
    { key: 'users',   label: 'Users',      width: '80px' },
    { key: 'status',  label: 'Status',     width: '100px' },
    { key: 'actions', label: '',           width: '60px' },
  ];

  return (
    <ModulePage
      title="Departments"
      subtitle="Organisational structure and department hierarchy"
      icon={Building2}
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(1); }}
      actions={[
        { label: 'New Department', icon: Plus, onClick: () => {}, variant: 'primary', permission: hasPermission('departments:create') },
      ]}
      columns={COLUMNS}
      isLoading={isLoading}
      isEmpty={!isLoading && (data?.data?.length ?? 0) === 0}
      meta={data?.meta}
      onPageChange={setPage}
      rows={
        <>
          {data?.data?.map((dept) => (
            <tr key={dept.id}>
              <td>
                <p className="font-medium text-gray-800">{dept.name}</p>
                <p className="text-xs text-gray-400 font-mono">{dept.code}</p>
              </td>
              <td className="text-xs text-gray-500">{dept.parent?.name ?? <span className="text-gray-300">—</span>}</td>
              <td className="text-xs text-gray-500 max-w-[180px] truncate">{dept.description ?? '—'}</td>
              <td className="text-sm text-gray-600">{dept._count?.users ?? 0}</td>
              <td>
                {dept.isActive
                  ? <Badge variant="green">Active</Badge>
                  : <Badge variant="gray">Inactive</Badge>}
              </td>
              <td>
                <button className="btn-ghost btn-icon w-8 h-8 text-gray-400">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </>
      }
    />
  );
}
