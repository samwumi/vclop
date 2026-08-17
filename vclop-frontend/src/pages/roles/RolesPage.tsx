import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Layers, Edit, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth.store';
import type { ApiResponse, PaginationMeta } from '@/types/api.types';
import type { Permission, Role } from '@/types/domain.types';

interface RolesResponse { data: Role[]; meta: PaginationMeta; }
const EMPTY_FORM = { name: '', code: '', description: '', permissionIds: [] as string[] };

export function RolesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const { hasPermission } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['roles', { page, search }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search) params.set('search', search);
      const { data } = await api.get<ApiResponse<Role[]>>(`/roles?${params}`);
      return { data: data.data ?? [], meta: data.meta! } as RolesResponse;
    },
    placeholderData: (prev) => prev,
  });

  const { data: permissionsData } = useQuery({ 
    queryKey: ['permissions', 'role-form'], 
    queryFn: async () => { 
      const { data } = await api.get<ApiResponse<Permission[]>>('/permissions?page=1&limit=200'); 
      return data.data ?? []; 
    }, 
    enabled: showForm || !!editingRole 
  });

  const { data: rolePermissions } = useQuery({
    queryKey: ['role-permissions', editingRole?.id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<string[]>>(`/roles/${editingRole!.id}/permissions`);
      return data.data ?? [];
    },
    enabled: !!editingRole,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: response } = await api.post<ApiResponse<Role>>('/roles', { code: form.code, name: form.name, description: form.description || undefined });
      await api.post(`/roles/${response.data!.id}/permissions/sync`, { permissionIds: form.permissionIds });
    },
    onSuccess: () => { toast.success('Role created with permissions'); setShowForm(false); setForm(EMPTY_FORM); queryClient.invalidateQueries({ queryKey: ['roles'] }); },
    onError: (error: unknown) => toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create role'),
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async (permissionIds: string[]) => {
      await api.post(`/roles/${editingRole!.id}/permissions/sync`, { permissionIds });
    },
    onSuccess: () => { 
      toast.success('Role permissions updated'); 
      setEditingRole(null); 
      queryClient.invalidateQueries({ queryKey: ['roles'] }); 
    },
    onError: (error: unknown) => toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update permissions'),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); createMutation.mutate(); };

  const COLUMNS = [
    { key: 'role',    label: 'Role' },
    { key: 'desc',    label: 'Description' },
    { key: 'perms',   label: 'Permissions', width: '120px' },
    { key: 'users',   label: 'Users',       width: '80px' },
    { key: 'system',  label: 'Type',        width: '100px' },
    { key: 'actions', label: '',            width: '60px' },
  ];

  return (
    <ModulePage
      title="Roles"
      subtitle="Permission templates assigned to users"
      icon={Layers}
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(1); }}
      actions={[
        { label: 'New Role', icon: Plus, onClick: () => setShowForm(true), variant: 'primary', permission: hasPermission('roles:create') },
      ]}
      columns={COLUMNS}
      isLoading={isLoading}
      isEmpty={!isLoading && (data?.data?.length ?? 0) === 0}
      meta={data?.meta}
      onPageChange={setPage}
      rows={
        <>
          {data?.data?.map((role) => (
            <tr key={role.id}>
              <td>
                <div>
                  <p className="font-medium text-gray-800">{role.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{role.code}</p>
                </div>
              </td>
              <td className="text-xs text-gray-500 max-w-[200px] truncate">{role.description ?? '—'}</td>
              <td>
                <span className="badge-blue">{role._count?.rolePermissions ?? '—'}</span>
              </td>
              <td className="text-sm text-gray-600">{role._count?.userRoles ?? '—'}</td>
              <td>
                {role.isSystem
                  ? <Badge variant="purple">System</Badge>
                  : <Badge variant="gray">Custom</Badge>}
              </td>
              <td>
                <button 
                  onClick={() => setEditingRole(role)}
                  className="btn-ghost btn-icon w-8 h-8 text-gray-400 hover:text-brand-600"
                  title="Edit permissions"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </>
      }
    >
          {showForm && <div className="card mb-5"><div className="card-body"><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><label className="form-label">Role name</label><input required className="form-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></div><div><label className="form-label">Role code</label><input required className="form-input" placeholder="LOAN_OFFICER" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} /></div></div><div><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div><div><label className="form-label">Permissions</label><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">{permissionsData?.filter((permission) => permission.isActive).map((permission) => <label key={permission.id} className="flex items-start gap-2 text-xs text-gray-700"><input type="checkbox" className="mt-0.5" checked={form.permissionIds.includes(permission.id)} onChange={(event) => setForm((current) => ({ ...current, permissionIds: event.target.checked ? [...current.permissionIds, permission.id] : current.permissionIds.filter((id) => id !== permission.id) }))} /><span><strong>{permission.code}</strong><br />{permission.name}</span></label>)}</div></div><div className="flex justify-end gap-3 border-t border-gray-100 pt-4"><button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" disabled={createMutation.isPending} className="btn-primary">{createMutation.isPending ? 'Creating…' : 'Create Role'}</button></div></form></div></div>}

      {editingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Edit Role Permissions</h2>
                <p className="text-sm text-gray-500 mt-1">{editingRole.name} ({editingRole.code})</p>
              </div>
              <button onClick={() => setEditingRole(null)} className="btn-ghost btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {rolePermissions && permissionsData ? (
                <PermissionSelector 
                  permissions={permissionsData}
                  selectedIds={rolePermissions}
                  onChange={(ids) => updatePermissionsMutation.mutate(ids)}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">Loading permissions...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </ModulePage>
  );
}

function PermissionSelector({ permissions, selectedIds, onChange }: { permissions: Permission[]; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const [localSelected, setLocalSelected] = useState<Set<string>>(new Set(selectedIds));
  
  const grouped = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handleToggle = (id: string) => {
    const newSet = new Set(localSelected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setLocalSelected(newSet);
  };

  const handleSelectAll = (category: string) => {
    const newSet = new Set(localSelected);
    grouped[category].forEach(p => newSet.add(p.id));
    setLocalSelected(newSet);
  };

  const handleDeselectAll = (category: string) => {
    const newSet = new Set(localSelected);
    grouped[category].forEach(p => newSet.delete(p.id));
    setLocalSelected(newSet);
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, perms]) => (
        <div key={category} className="border border-gray-200 rounded-lg">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">{category.replace(/_/g, ' ')}</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => handleSelectAll(category)} 
                className="text-xs text-brand-600 hover:text-brand-700"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button 
                onClick={() => handleDeselectAll(category)} 
                className="text-xs text-gray-600 hover:text-gray-700"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {perms.map(p => (
              <label key={p.id} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input 
                  type="checkbox" 
                  className="mt-0.5" 
                  checked={localSelected.has(p.id)}
                  onChange={() => handleToggle(p.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{p.code}</p>
                  <p className="text-xs text-gray-500">{p.name}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
        <button 
          onClick={() => onChange(Array.from(localSelected))} 
          className="btn-primary"
        >
          Save Permissions
        </button>
      </div>
    </div>
  );
}
