import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Download, Users, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { ModulePage } from '@/components/ui/ModulePage';
import { UserStatusBadge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate } from '@/lib/utils';
import type { ApiResponse, PaginationMeta } from '@/types/api.types';
import type { Role, User } from '@/types/domain.types';

interface UsersResponse { data: User[]; meta: PaginationMeta; }
interface RolesResponse { data: Role[]; meta: PaginationMeta; }

const EMPTY_FORM = { firstName: '', lastName: '', email: '', username: '', password: '', jobTitle: '', roleIds: [] as string[] };

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const { hasPermission } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, search }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search) params.set('search', search);
      const { data } = await api.get<ApiResponse<User[]>>(`/users?${params}`);
      return { data: data.data ?? [], meta: data.meta! } as UsersResponse;
    },
    placeholderData: (prev) => prev,
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles', 'provisioning'],
    queryFn: async () => { const { data } = await api.get<ApiResponse<Role[]>>('/roles?page=1&limit=100'); return data.data ?? []; },
    enabled: showForm,
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/users', form),
    onSuccess: () => { toast.success('User created and role assigned'); setShowForm(false); setForm(EMPTY_FORM); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (error: unknown) => toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create user'),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); createMutation.mutate(); };

  const COLUMNS = [
    { key: 'employee', label: 'Employee' },
    { key: 'contact',  label: 'Contact' },
    { key: 'branch',   label: 'Branch' },
    { key: 'status',   label: 'Status',  width: '120px' },
    { key: 'lastLogin',label: 'Last Login', width: '150px' },
    { key: 'actions',  label: '',         width: '60px' },
  ];

  return (
    <ModulePage
      title="Users"
      subtitle="Manage platform users and their permissions"
      icon={Users}
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(1); }}
      actions={[
        { label: 'Export', icon: Download, onClick: () => {}, permission: hasPermission('users:export') },
        { label: 'New User', icon: Plus, onClick: () => setShowForm(true), variant: 'primary', permission: hasPermission('users:create') },
      ]}
      columns={COLUMNS}
      isLoading={isLoading}
      isEmpty={!isLoading && (data?.data?.length ?? 0) === 0}
      meta={data?.meta}
      onPageChange={setPage}
      rows={
        <>
          {data?.data?.map((user) => (
            <tr key={user.id}>
              <td>
                <div>
                  <p className="font-medium text-gray-800">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-400">{user.employeeId ?? user.username}</p>
                </div>
              </td>
              <td>
                <p className="text-xs">{user.email}</p>
                <p className="text-xs text-gray-400">{user.phone ?? '—'}</p>
              </td>
              <td className="text-xs">{user.branch?.name ?? '—'}</td>
              <td><UserStatusBadge status={user.status} /></td>
              <td className="text-xs text-gray-500">{formatDate(user.lastLoginAt)}</td>
              <td>
                <button className="btn-ghost btn-icon w-8 h-8 text-gray-400" onClick={() => {}}>
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </>
      }
    >
      {showForm && <div className="card mb-5"><div className="card-body"><form className="space-y-4" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><div><label className="form-label">First name</label><input required className="form-input" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} /></div><div><label className="form-label">Last name</label><input required className="form-input" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} /></div><div><label className="form-label">Email</label><input required type="email" className="form-input" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></div><div><label className="form-label">Username</label><input required className="form-input" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value.toLowerCase() }))} /></div><div><label className="form-label">Temporary password</label><input required type="password" minLength={8} className="form-input" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} /></div><div><label className="form-label">Job title</label><input className="form-input" value={form.jobTitle} onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value }))} /></div></div><div><label className="form-label">Roles</label><div className="grid gap-2 sm:grid-cols-2">{rolesData?.filter((role) => role.isActive).map((role) => <label key={role.id} className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.roleIds.includes(role.id)} onChange={(event) => setForm((current) => ({ ...current, roleIds: event.target.checked ? [...current.roleIds, role.id] : current.roleIds.filter((id) => id !== role.id) }))} />{role.name}</label>)}</div></div><div className="flex justify-end gap-3 border-t border-gray-100 pt-4"><button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating…' : 'Create User'}</button></div></form></div></div>}
    </ModulePage>
  );
}
