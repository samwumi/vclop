import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, GitBranch, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth.store';
import type { ApiResponse, PaginationMeta } from '@/types/api.types';
import type { Branch } from '@/types/domain.types';

interface BranchesResponse { data: Branch[]; meta: PaginationMeta; }

const EMPTY_FORM = {
  code: '', name: '', city: '', state: '', address: '',
  phone: '', email: '', managerName: '',
};

// ── Create/Edit slide-over ────────────────────────────────────────────────────

interface BranchFormProps {
  onClose: () => void;
}

function BranchForm({ onClose }: BranchFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const qc = useQueryClient();

  const set = (k: keyof typeof EMPTY_FORM, v: string) => setForm(f => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: () => api.post('/branches', {
      code: form.code.toUpperCase(),
      name: form.name,
      country: 'Nigeria',
      city:    form.city    || undefined,
      state:   form.state   || undefined,
      address: form.address || undefined,
      phone:   form.phone   || undefined,
      email:   form.email   || undefined,
      managerName: form.managerName || undefined,
    }),
    onSuccess: () => {
      toast.success(`Branch "${form.name}" created`);
      // Invalidate every branch-related cache so dropdowns refresh immediately
      qc.invalidateQueries({ queryKey: ['branches'] });
      onClose();
    },
    onError: (e: unknown) =>
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Failed to create branch',
      ),
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-sm bg-white h-full shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Add New Location / Branch</h2>
          <button onClick={onClose} className="btn-ghost btn-icon w-8 h-8 text-gray-400 text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="form-label">Branch Code <span className="text-red-500">*</span></label>
            <input className="form-input uppercase" placeholder="e.g. LOC-SURULERE" value={form.code}
              onChange={e => set('code', e.target.value)} />
            <p className="text-xs text-gray-400 mt-0.5">Short unique code — no spaces, uppercase.</p>
          </div>
          <div>
            <label className="form-label">Location Name <span className="text-red-500">*</span></label>
            <input className="form-input" placeholder="e.g. Surulere" value={form.name}
              onChange={e => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">City</label>
              <input className="form-input" placeholder="Lagos" value={form.city}
                onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label className="form-label">State</label>
              <input className="form-input" placeholder="Lagos State" value={form.state}
                onChange={e => set('state', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="form-label">Address</label>
            <textarea className="form-input" rows={2} placeholder="Full street address" value={form.address}
              onChange={e => set('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="+234…" value={form.phone}
                onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="branch@vclop.local" value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="form-label">Branch Manager</label>
            <input className="form-input" placeholder="Manager full name" value={form.managerName}
              onChange={e => set('managerName', e.target.value)} />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => createMutation.mutate()}
            disabled={!form.code || !form.name || createMutation.isPending}
            className="btn-primary w-full disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating…' : 'Create Location'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function BranchesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const { hasPermission } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['branches', { page, search }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search) params.set('search', search);
      const { data } = await api.get<ApiResponse<Branch[]>>(`/branches?${params}`);
      // TransformInterceptor lifts paginated result: data.data = array, data.meta = pagination
      return { data: data.data ?? [], meta: data.meta! } as BranchesResponse;
    },
    placeholderData: (prev) => prev,
  });

  return (
    <>
      {showForm && <BranchForm onClose={() => setShowForm(false)} />}

      <ModulePage
        title="Locations & Branches"
        subtitle="Manage office locations — new locations appear immediately in customer registration and user assignment forms"
        icon={GitBranch}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        actions={[
          {
            label: 'New Location',
            icon: Plus,
            onClick: () => setShowForm(true),
            variant: 'primary',
            permission: hasPermission('branches:create'),
          },
        ]}
        columns={[
          { key: 'branch',   label: 'Branch' },
          { key: 'location', label: 'Location' },
          { key: 'contact',  label: 'Contact' },
          { key: 'manager',  label: 'Manager',  width: '160px' },
          { key: 'users',    label: 'Users',    width: '80px' },
          { key: 'status',   label: 'Status',   width: '110px' },
        ]}
        isLoading={isLoading}
        isEmpty={!isLoading && (data?.data?.length ?? 0) === 0}
        emptyIcon={GitBranch}
        emptyTitle="No locations yet"
        emptyDescription="Create the first location — it will appear in the customer registration form immediately."
        meta={data?.meta}
        onPageChange={setPage}
        rows={
          <>
            {data?.data?.map((branch) => (
              <tr key={branch.id}>
                <td>
                  <p className="font-medium text-gray-800">{branch.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{branch.code}</p>
                </td>
                <td>
                  <div className="flex items-start gap-1 text-xs text-gray-600">
                    <MapPin className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                    <span>{[branch.city, branch.state, branch.country].filter(Boolean).join(', ') || '—'}</span>
                  </div>
                  {branch.address && (
                    <p className="text-xs text-gray-400 pl-4 mt-0.5 truncate max-w-[200px]">{branch.address}</p>
                  )}
                </td>
                <td>
                  <p className="text-xs">{branch.email ?? '—'}</p>
                  <p className="text-xs text-gray-400">{branch.phone ?? '—'}</p>
                </td>
                <td className="text-xs text-gray-600">{branch.managerName ?? '—'}</td>
                <td className="text-sm text-gray-600">{(branch as Branch & { _count?: { users: number } })._count?.users ?? 0}</td>
                <td>
                  {branch.isHeadOffice
                    ? <Badge variant="purple">Head Office</Badge>
                    : branch.isActive
                      ? <Badge variant="green">Active</Badge>
                      : <Badge variant="gray">Inactive</Badge>}
                </td>
              </tr>
            ))}
          </>
        }
      />
    </>
  );
}
