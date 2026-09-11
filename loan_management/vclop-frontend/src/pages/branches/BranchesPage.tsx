import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, GitBranch, MoreHorizontal, MapPin } from 'lucide-react';
import { api } from '@/lib/axios';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth.store';
import type { ApiResponse, PaginationMeta } from '@/types/api.types';
import type { Branch } from '@/types/domain.types';

interface BranchesResponse { data: Branch[]; meta: PaginationMeta; }

export function BranchesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { hasPermission } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['branches', { page, search }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search) params.set('search', search);
      const { data } = await api.get<ApiResponse<BranchesResponse>>(`/branches?${params}`);
      return data.data!;
    },
    placeholderData: (prev) => prev,
  });

  const COLUMNS = [
    { key: 'branch',  label: 'Branch' },
    { key: 'location',label: 'Location' },
    { key: 'contact', label: 'Contact' },
    { key: 'manager', label: 'Manager', width: '160px' },
    { key: 'users',   label: 'Users',   width: '80px' },
    { key: 'status',  label: 'Status',  width: '100px' },
    { key: 'actions', label: '',        width: '60px' },
  ];

  return (
    <ModulePage
      title="Branches"
      subtitle="Manage office locations and branches"
      icon={GitBranch}
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(1); }}
      actions={[
        { label: 'New Branch', icon: Plus, onClick: () => {}, variant: 'primary', permission: hasPermission('branches:create') },
      ]}
      columns={COLUMNS}
      isLoading={isLoading}
      isEmpty={!isLoading && (data?.data?.length ?? 0) === 0}
      meta={data?.meta}
      onPageChange={setPage}
      rows={
        <>
          {data?.data?.map((branch) => (
            <tr key={branch.id}>
              <td>
                <div>
                  <p className="font-medium text-gray-800">{branch.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{branch.code}</p>
                </div>
              </td>
              <td>
                <div className="flex items-start gap-1 text-xs text-gray-600">
                  <MapPin className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                  <span>{[branch.city, branch.state, branch.country].filter(Boolean).join(', ') || '—'}</span>
                </div>
              </td>
              <td>
                <p className="text-xs">{branch.email ?? '—'}</p>
                <p className="text-xs text-gray-400">{branch.phone ?? '—'}</p>
              </td>
              <td className="text-xs text-gray-600">{branch.managerName ?? '—'}</td>
              <td className="text-sm text-gray-600">{branch._count?.users ?? 0}</td>
              <td>
                {branch.isHeadOffice
                  ? <Badge variant="purple">Head Office</Badge>
                  : branch.isActive
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
