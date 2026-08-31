import { useState, useEffect, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Download, Users, MoreHorizontal, KeyRound, Trash2, ShieldOff, ShieldCheck, Unlock, Key, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { ModulePage } from '@/components/ui/ModulePage';
import { UserStatusBadge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate } from '@/lib/utils';
import { LocationPermissionsModal } from './LocationPermissionsModal';
import type { ApiResponse, PaginationMeta } from '@/types/api.types';
import type { Role, User } from '@/types/domain.types';

interface Branch { id: string; code: string; name: string; }
interface Department { id: string; code: string; name: string; }
interface UsersResponse { data: User[]; meta: PaginationMeta; }
interface Permission { id: string; code: string; name: string; category: string; isActive: boolean; }

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', username: '',
  password: '', jobTitle: '', branchId: '', departmentId: '',
  roleIds: [] as string[],
  additionalBranchIds: [] as string[], // for multi-branch roles
};

// Roles that are NOT location-based (see everything across all branches)
const NON_LOCATION_ROLE_CODES = ['INTERNAL_CONTROL', 'ACCOUNTING_HEAD', 'MANAGER', 'SYSTEM_ADMIN'];
// Roles that can cover multiple locations (primary + additional branches)
const MULTI_LOCATION_ROLE_CODES = ['COMPLIANCE_OFFICER', 'ACCOUNTANT'];

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [resetPwdUserId, setResetPwdUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [permissionsUserId, setPermissionsUserId] = useState<string | null>(null);
  const [locationPermUserId, setLocationPermUserId] = useState<string | null>(null);
  const [locationPermUserName, setLocationPermUserName] = useState('');
  const { hasPermission, user: currentUser } = useAuthStore();
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

  const { data: rolesData = [] } = useQuery({
    queryKey: ['roles', 'all'],
    queryFn: async () => {
      try {
        const res = await api.get('/roles?page=1&limit=100');
        const d = res.data?.data;
        return (Array.isArray(d) ? d : d?.data ?? []) as Role[];
      } catch { return [] as Role[]; }
    },
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['branches', 'locations'],
    queryFn: async () => {
      try {
        const res = await api.get('/branches/locations');
        const d = res.data?.data;
        return (Array.isArray(d) ? d : d?.data ?? []) as Branch[];
      } catch { return []; }
    },
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments', 'all'],
    queryFn: async () => {
      try {
        const res = await api.get('/departments?limit=100');
        const d = res.data?.data;
        return (Array.isArray(d) ? d : d?.data ?? []) as Department[];
      } catch { return []; }
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { additionalBranchIds, ...userFields } = form;
      const res = await api.post('/users', {
        ...userFields,
        branchId:     form.branchId     || undefined,
        departmentId: form.departmentId || undefined,
        jobTitle:     form.jobTitle     || undefined,
      });
      const userId = res.data?.data?.id;
      // Assign additional branches for multi-location roles
      if (userId && form.additionalBranchIds.length > 0) {
        await Promise.all(
          form.additionalBranchIds.map(bid =>
            api.post(`/users/${userId}/branches`, { branchId: bid }).catch(() => {})
          )
        );
      }
    },
    onSuccess: () => {
      toast.success('User created');
      setShowForm(false);
      setForm(EMPTY_FORM);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string; errors?: unknown } } })?.response?.data?.message;
      const errors = (e as { response?: { data?: { message?: string; errors?: unknown } } })?.response?.data?.errors;
      toast.error(msg ?? `Failed to create user. ${errors ? JSON.stringify(errors) : 'Check console.'}`);
      console.error('Create user error:', e);
    },
  });

  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); createMutation.mutate(); };
  const set = <K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) =>
      api.post(`/users/${userId}/reset-password`, { newPassword: password }),
    onSuccess: () => {
      toast.success('Password reset. User must change on next login.');
      setResetPwdUserId(null);
      setNewPassword('');
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Reset failed'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) =>
      api.patch(`/users/${userId}`, { status }),
    onSuccess: () => {
      toast.success('User status updated');
      qc.invalidateQueries({ queryKey: ['users'] });
      setOpenMenuId(null);
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  });

  const unlockMutation = useMutation({
    mutationFn: async (userId: string) => api.post(`/users/${userId}/unlock`),
    onSuccess: () => {
      toast.success('User account unlocked');
      qc.invalidateQueries({ queryKey: ['users'] });
      setOpenMenuId(null);
    },
    onError: () => toast.error('Failed to unlock'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      toast.success('User deleted');
      qc.invalidateQueries({ queryKey: ['users'] });
      setOpenMenuId(null);
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Delete failed'),
  });

  return (
    <>
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
              <td onClick={e => e.stopPropagation()} className="relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                  className="btn-ghost btn-icon w-8 h-8 text-gray-400"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {openMenuId === user.id && (
                  <div className="absolute right-0 top-8 w-52 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-1 overflow-hidden">
                    {/* Manage Permissions */}
                    {hasPermission('users:manage_permissions') && (
                      <button
                        onClick={() => { setPermissionsUserId(user.id); setOpenMenuId(null); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Key className="w-4 h-4 text-gray-400" /> Manage Permissions
                      </button>
                    )}
                    {/* Location Permissions */}
                    {hasPermission('users:update') && (
                      <button
                        onClick={() => { 
                          setLocationPermUserId(user.id); 
                          setLocationPermUserName(`${user.firstName} ${user.lastName}`);
                          setOpenMenuId(null); 
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <MapPin className="w-4 h-4 text-gray-400" /> Location Permissions
                      </button>
                    )}
                    {/* Reset password */}
                    {hasPermission('users:reset_password') && (
                      <button
                        onClick={() => { setResetPwdUserId(user.id); setOpenMenuId(null); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <KeyRound className="w-4 h-4 text-gray-400" /> Reset Password
                      </button>
                    )}
                    {/* Unlock */}
                    {hasPermission('users:update') && user.status === 'LOCKED' && (
                      <button
                        onClick={() => unlockMutation.mutate(user.id)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50"
                      >
                        <Unlock className="w-4 h-4" /> Unlock Account
                      </button>
                    )}
                    {/* Activate / Deactivate */}
                    {hasPermission('users:update') && user.id !== currentUser?.id && (
                      user.status === 'ACTIVE' ? (
                        <button
                          onClick={() => toggleStatusMutation.mutate({ userId: user.id, status: 'SUSPENDED' })}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50"
                        >
                          <ShieldOff className="w-4 h-4" /> Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleStatusMutation.mutate({ userId: user.id, status: 'ACTIVE' })}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50"
                        >
                          <ShieldCheck className="w-4 h-4" /> Activate
                        </button>
                      )
                    )}
                    {/* Delete */}
                    {hasPermission('users:delete') && user.id !== currentUser?.id && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${user.firstName} ${user.lastName}? This cannot be undone.`)) {
                            deleteMutation.mutate(user.id);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                      >
                        <Trash2 className="w-4 h-4" /> Delete User
                      </button>
                    )}
                  </div>
                )}
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

              {/* Basic fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="form-label">First Name <span className="text-red-500">*</span></label><input required className="form-input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></div>
                <div><label className="form-label">Last Name <span className="text-red-500">*</span></label><input required className="form-input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></div>
                <div><label className="form-label">Email <span className="text-red-500">*</span></label><input required type="email" className="form-input" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
                <div><label className="form-label">Username <span className="text-red-500">*</span></label><input required className="form-input" value={form.username} onChange={(e) => set('username', e.target.value.toLowerCase())} /></div>
                <div><label className="form-label">Temporary Password <span className="text-red-500">*</span></label><input required type="password" minLength={8} className="form-input" value={form.password} onChange={(e) => set('password', e.target.value)} /></div>
                <div><label className="form-label">Job Title</label><input className="form-input" value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} placeholder="e.g. Loan Officer" /></div>
              </div>

              {/* Roles — select before location so branch field adapts */}
              <div>
                <label className="form-label">Roles <span className="text-red-500">*</span></label>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 p-3 border border-gray-200 rounded-lg">
                  {rolesData?.filter((r) => r.isActive).map((role) => (
                    <label key={role.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={form.roleIds.includes(role.id)}
                        onChange={(e) => set('roleIds', e.target.checked ? [...form.roleIds, role.id] : form.roleIds.filter((id) => id !== role.id))} />
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* Location — adapts based on selected role */}
              <div className="grid gap-4 sm:grid-cols-2">
                {(() => {
                  const selectedRoleCodes = (rolesData ?? []).filter(r => form.roleIds.includes(r.id)).map(r => r.code);
                  const isNonLocation = selectedRoleCodes.some(c => NON_LOCATION_ROLE_CODES.includes(c));
                  const isMultiLocation = selectedRoleCodes.some(c => MULTI_LOCATION_ROLE_CODES.includes(c));

                  if (form.roleIds.length === 0) {
                    return <div className="sm:col-span-2 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500">Select a role above to configure location settings.</div>;
                  }
                  if (isNonLocation) {
                    return <div className="sm:col-span-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">ℹ This role is not location-based — the user sees data across all branches.</div>;
                  }
                  return (
                    <>
                      <div>
                        <label className="form-label">Location / Branch <span className="text-red-500">*</span></label>
                        <select className="form-input" value={form.branchId} onChange={(e) => set('branchId', e.target.value)}>
                          <option value="">Select location…</option>
                          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      {isMultiLocation && (
                        <div>
                          <label className="form-label">Additional Locations (optional)</label>
                          <div className="border border-gray-200 rounded-lg p-3 space-y-1.5 max-h-40 overflow-y-auto">
                            {branches.filter(b => b.id !== form.branchId).map(b => (
                              <label key={b.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={form.additionalBranchIds.includes(b.id)}
                                  onChange={e => set('additionalBranchIds', e.target.checked ? [...form.additionalBranchIds, b.id] : form.additionalBranchIds.filter(id => id !== b.id))} />
                                {b.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
                <div>
                  <label className="form-label">Department</label>
                  <select className="form-input" value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
                    <option value="">Select department…</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating…' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>

    {/* Reset Password Modal */}
    {resetPwdUserId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/40" onClick={() => { setResetPwdUserId(null); setNewPassword(''); }} />
        <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brand-600" /> Reset Password
          </h3>
          <div>
            <label className="form-label">New Temporary Password</label>
            <input
              type="text"
              className="form-input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min 8 chars, include uppercase + number"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">User will be required to change this on next login.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => { setResetPwdUserId(null); setNewPassword(''); }}
              className="btn-secondary"
            >Cancel</button>
            <button
              onClick={() => {
                if (!newPassword || newPassword.length < 8) {
                  toast.error('Password must be at least 8 characters');
                  return;
                }
                resetPasswordMutation.mutate({ userId: resetPwdUserId, password: newPassword });
              }}
              disabled={resetPasswordMutation.isPending}
              className="btn-primary disabled:opacity-50"
            >
              {resetPasswordMutation.isPending ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Manage Permissions Modal */}
    {permissionsUserId && <UserPermissionsModal userId={permissionsUserId} onClose={() => setPermissionsUserId(null)} />}

    {/* Location Permissions Modal */}
    {locationPermUserId && (
      <LocationPermissionsModal 
        userId={locationPermUserId} 
        userName={locationPermUserName}
        onClose={() => {
          setLocationPermUserId(null);
          setLocationPermUserName('');
        }} 
      />
    )}
  </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// User Permissions Modal Component
// ──────────────────────────────────────────────────────────────────────────────
function UserPermissionsModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});

  // Fetch all permissions
  const { data: allPermissions = [] } = useQuery<Permission[]>({
    queryKey: ['permissions', 'all'],
    queryFn: async () => {
      const res = await api.get('/permissions?limit=500');
      const d = res.data?.data;
      return (Array.isArray(d) ? d : d?.data ?? []) as Permission[];
    },
  });

  // Fetch user's current permission overrides
  const { data: userPermissionsData = [], isLoading } = useQuery<Array<{ permissionId: string; granted: boolean }>>({
    queryKey: ['users', userId, 'permissions'],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/permissions`);
      return res.data?.data ?? [];
    },
  });

  // Initialize selected permissions when data loads
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    userPermissionsData.forEach((p) => {
      initial[p.permissionId] = p.granted;
    });
    setSelectedPermissions(initial);
  }, [userPermissionsData]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Build the permissions array with granted/revoked status
      const permissions = Object.entries(selectedPermissions).map(([permissionId, granted]) => ({
        permissionId,
        granted,
      }));
      await api.post(`/users/${userId}/permissions`, { permissions });
    },
    onSuccess: () => {
      toast.success('User permissions updated');
      qc.invalidateQueries({ queryKey: ['users', userId, 'permissions'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to update permissions');
    },
  });

  // Group permissions by category
  const groupedPermissions = allPermissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  const togglePermission = (permissionId: string, currentState: boolean | undefined) => {
    setSelectedPermissions(prev => {
      const newState = { ...prev };
      if (currentState === undefined) {
        // Not set yet - grant it
        newState[permissionId] = true;
      } else if (currentState === true) {
        // Currently granted - revoke it (explicit deny)
        newState[permissionId] = false;
      } else {
        // Currently revoked - remove override (inherit from role)
        delete newState[permissionId];
      }
      return newState;
    });
  };

  const getPermissionState = (permissionId: string): 'granted' | 'revoked' | 'inherit' => {
    const state = selectedPermissions[permissionId];
    if (state === true) return 'granted';
    if (state === false) return 'revoked';
    return 'inherit';
  };

  const selectAllInCategory = (category: string, granted: boolean) => {
    setSelectedPermissions(prev => {
      const newState = { ...prev };
      groupedPermissions[category]?.forEach(p => {
        newState[p.id] = granted;
      });
      return newState;
    });
  };

  const clearAllInCategory = (category: string) => {
    setSelectedPermissions(prev => {
      const newState = { ...prev };
      groupedPermissions[category]?.forEach(p => {
        delete newState[p.id];
      });
      return newState;
    });
  };

  const user = qc.getQueryData<UsersResponse>(['users'])?.data?.find(u => u.id === userId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Key className="w-5 h-5 text-brand-600" /> Manage Permissions
            </h3>
            {user && <p className="text-sm text-gray-500">{user.firstName} {user.lastName}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost btn-icon">
            <span className="text-gray-400 text-xl">×</span>
          </button>
        </div>

        {/* Info banner */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-xs text-blue-700">
            💡 <strong>Grant</strong> = Give permission directly. <strong>Revoke</strong> = Explicitly deny (overrides role). <strong>Inherit</strong> = Use role permissions (default).
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading permissions...</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Category header */}
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">{category}</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => selectAllInCategory(category, true)}
                        className="text-xs text-emerald-600 hover:text-emerald-700"
                      >
                        Grant All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => selectAllInCategory(category, false)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Revoke All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => clearAllInCategory(category)}
                        className="text-xs text-gray-600 hover:text-gray-700"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Permissions list */}
                  <div className="p-3 space-y-2">
                    {perms.map((perm) => {
                      const state = getPermissionState(perm.id);
                      return (
                        <div
                          key={perm.id}
                          className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{perm.name}</p>
                            <p className="text-xs text-gray-400">{perm.code}</p>
                          </div>
                          <button
                            onClick={() => togglePermission(perm.id, selectedPermissions[perm.id])}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              state === 'granted'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : state === 'revoked'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {state === 'granted' ? '✓ Granted' : state === 'revoked' ? '✗ Revoked' : 'Inherit'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="btn-primary disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
