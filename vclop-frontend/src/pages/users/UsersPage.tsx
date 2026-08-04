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

interface Branch { id: string; code: string; name: string; }
interface Department { id: string; code: string; name: string; }
interface UsersResponse { data: User[]; meta: PaginationMeta; }

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', username: '',
  password: '', jobTitle: '', branchId: '', departmentId: '',
  roleIds: [] as string[],
};

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const { hasPermission } = useAuthStore();
  const qc = useQueryClient();

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
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Role[]>>('/roles?page=1&limit=100');
      return data.data ?? [];
    },
    enabled: showForm,
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['branches', 'locations'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Branch[]>>('/branches/locations');
      return data.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments', 'list'],
    queryFn: async () => {
      const res = await api.get('/departments/list');
      // Paginated response: res.data.data = { data: [...], meta: {} }
      // Or direct array: res.data.data = [...]
      const payload = res.data?.data;
      if (Array.isArray(payload)) return payload as Department[];
      if (payload?.data && Array.isArray(payload.data)) return payload.data as Department[];
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/users', {
      ...form,
      branchId:     form.branchId     || undefined,
      departmentId: form.departmentId || undefined,
      jobTitle:     form.jobTitle     || undefined,
    }),
    onSuccess: () => {
      toast.success('User created');
      setShowForm(false);
      setForm(EMPTY_FORM);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create user'),
  });

  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); createMutation.mutate(); };
  const set = <K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <ModulePage
      title="Users"
      subtitle="Manage platform users, their roles and branch assignments"
      icon={Users}
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(1); }}
      actions={[
        { label: 'Export',   icon: Download, onClick: () => {}, permission: hasPermission('users:export') },
        { label: 'New User', icon: Plus,     onClick: () => setShowForm(true), variant: 'primary', permission: hasPermission('users:create') },
      ]}
      columns={[
        { key: 'employee',  label: 'Employee' },
        { key: 'contact',   label: 'Contact' },
        { key: 'branch',    label: 'Branch / Location' },
        { key: 'status',    label: 'Status',     width: '120px' },
        { key: 'lastLogin', label: 'Last Login', width: '150px' },
        { key: 'actions',   label: '',           width: '60px' },
      ]}
      isLoading={isLoading}
      isEmpty={!isLoading && (data?.data?.length ?? 0) === 0}
      emptyIcon={Users}
      emptyTitle="No users yet"
      emptyDescription="Create the first user account to get started."
      meta={data?.meta}
      onPageChange={setPage}
      rows={
        <>
          {data?.data?.map((user) => (
            <tr key={user.id}>
              <td>
                <p className="font-medium text-gray-800">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-400">{user.employeeId ?? user.username}</p>
                {user.jobTitle && <p className="text-xs text-gray-400">{user.jobTitle}</p>}
              </td>
              <td>
                <p className="text-xs">{user.email}</p>
                <p className="text-xs text-gray-400">{user.phone ?? '—'}</p>
              </td>
              <td className="text-xs">{user.branch?.name ?? '—'}</td>
              <td><UserStatusBadge status={user.status} /></td>
              <td className="text-xs text-gray-500">{formatDate(user.lastLoginAt)}</td>
              <td>
                <button className="btn-ghost btn-icon w-8 h-8 text-gray-400">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </>
      }
    >
      {showForm && (
        <div className="card mb-5">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-800">Create New User</h3>
          </div>
          <div className="card-body">
            <form className="space-y-4" onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">First Name <span className="text-red-500">*</span></label>
                  <input required className="form-input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Last Name <span className="text-red-500">*</span></label>
                  <input required className="form-input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Email <span className="text-red-500">*</span></label>
                  <input required type="email" className="form-input" value={form.email} onChange={(e) => set('email', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Username <span className="text-red-500">*</span></label>
                  <input required className="form-input" value={form.username} onChange={(e) => set('username', e.target.value.toLowerCase())} />
                </div>
                <div>
                  <label className="form-label">Temporary Password <span className="text-red-500">*</span></label>
                  <input required type="password" minLength={8} className="form-input" value={form.password} onChange={(e) => set('password', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Job Title</label>
                  <input className="form-input" value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} placeholder="e.g. Loan Officer" />
                </div>

                {/* Location / Branch */}
                <div>
                  <label className="form-label">Location / Branch <span className="text-red-500">*</span></label>
                  <select required className="form-input" value={form.branchId} onChange={(e) => set('branchId', e.target.value)}>
                    <option value="">Select location…</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Primary location. Compliance/accounting staff can be assigned additional locations after creation.
                  </p>
                </div>

                {/* Department */}
                <div>
                  <label className="form-label">Department</label>
                  <select className="form-input" value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
                    <option value="">Select department…</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roles */}
              <div>
                <label className="form-label">Roles <span className="text-red-500">*</span></label>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 p-3 border border-gray-200 rounded-lg">
                  {rolesData?.filter((r) => r.isActive).map((role) => (
                    <label key={role.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.roleIds.includes(role.id)}
                        onChange={(e) =>
                          set('roleIds', e.target.checked
                            ? [...form.roleIds, role.id]
                            : form.roleIds.filter((id) => id !== role.id))
                        }
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
