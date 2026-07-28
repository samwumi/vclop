import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services/admin.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth.store';
import type { InterestType, LoanProduct, RepaymentFrequencyType } from '@/types/domain.types';

const EMPTY_FORM = {
  code: '', name: '', description: '',
  minAmount: '', maxAmount: '', minTenureDays: '', maxTenureDays: '',
  interestType: 'FLAT' as InterestType, interestRate: '',
  repaymentFrequency: 'MONTHLY' as RepaymentFrequencyType,
  requiresGuarantor: false, requiresCollateral: false,
};

export function LoanProductsAdminPage() {
  const { hasPermission } = useAuthStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin', 'loan-products'],
    queryFn: () => adminService.loanProducts.list() as Promise<LoanProduct[]>,
  });

  const createMutation = useMutation({
    mutationFn: () => adminService.loanProducts.create({
      code: form.code,
      name: form.name,
      description: form.description || undefined,
      minAmount: Number(form.minAmount),
      maxAmount: Number(form.maxAmount),
      minTenureDays: Number(form.minTenureDays),
      maxTenureDays: Number(form.maxTenureDays),
      interestType: form.interestType,
      interestRate: Number(form.interestRate),
      repaymentFrequency: form.repaymentFrequency,
      requiresGuarantor: form.requiresGuarantor,
      requiresCollateral: form.requiresCollateral,
    }),
    onSuccess: () => {
      toast.success('Loan product created');
      qc.invalidateQueries({ queryKey: ['admin', 'loan-products'] });
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create product'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => adminService.loanProducts.remove(id),
    onSuccess: () => { toast.success('Loan product deleted'); qc.invalidateQueries({ queryKey: ['admin', 'loan-products'] }); },
    onError: () => toast.error('Cannot delete — applications already reference this product. Deactivate it instead.'),
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createMutation.mutate();
  };

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <Breadcrumbs />
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Loan Products</h1>
          <p className="page-description">Configure available loan products, rates, and rules — no code changes needed.</p>
        </div>
        {hasPermission('loan_products:create') && (
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> New Product
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-5">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Code (unique)</label>
                  <input className="form-input" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea rows={2} className="form-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="form-label">Min Amount</label>
                  <input type="number" className="form-input" value={form.minAmount} onChange={(e) => setForm((f) => ({ ...f, minAmount: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Max Amount</label>
                  <input type="number" className="form-input" value={form.maxAmount} onChange={(e) => setForm((f) => ({ ...f, maxAmount: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Min Tenure (days)</label>
                  <input type="number" className="form-input" value={form.minTenureDays} onChange={(e) => setForm((f) => ({ ...f, minTenureDays: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Max Tenure (days)</label>
                  <input type="number" className="form-input" value={form.maxTenureDays} onChange={(e) => setForm((f) => ({ ...f, maxTenureDays: e.target.value }))} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="form-label">Interest Type</label>
                  <select className="form-input" value={form.interestType} onChange={(e) => setForm((f) => ({ ...f, interestType: e.target.value as InterestType }))}>
                    <option value="FLAT">Flat</option>
                    <option value="REDUCING_BALANCE">Reducing Balance</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Interest Rate (% for full tenure)</label>
                  <input type="number" step="0.01" className="form-input" value={form.interestRate} onChange={(e) => setForm((f) => ({ ...f, interestRate: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Repayment Frequency</label>
                  <select className="form-input" value={form.repaymentFrequency} onChange={(e) => setForm((f) => ({ ...f, repaymentFrequency: e.target.value as RepaymentFrequencyType }))}>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Biweekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.requiresGuarantor} onChange={(e) => setForm((f) => ({ ...f, requiresGuarantor: e.target.checked }))} />
                  Requires guarantor
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.requiresCollateral} onChange={(e) => setForm((f) => ({ ...f, requiresCollateral: e.target.checked }))} />
                  Requires collateral
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary disabled:opacity-50">
                  {createMutation.isPending ? 'Creating…' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!products?.length ? (
        <div className="card"><EmptyState icon={Settings} title="No loan products yet" description="Create one to let customers start applying." /></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Product</th><th>Interest</th><th>Range</th><th>Tenure</th><th>Frequency</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.code}</p>
                  </td>
                  <td>
                    <p className="text-sm">{p.interestRate}%</p>
                    <p className="text-xs text-gray-400">{p.interestType.replace(/_/g, ' ')}</p>
                  </td>
                  <td className="text-xs text-gray-600">
                    ₦{Number(p.minAmount).toLocaleString()} – ₦{Number(p.maxAmount).toLocaleString()}
                  </td>
                  <td className="text-xs text-gray-600">{p.minTenureDays}–{p.maxTenureDays} days</td>
                  <td className="text-xs text-gray-600">{p.repaymentFrequency}</td>
                  <td><Badge variant={p.isActive ? 'green' : 'gray'}>{p.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td>
                    {hasPermission('loan_products:delete') && (
                      <button onClick={() => removeMutation.mutate(p.id)} className="btn-ghost btn-icon w-7 h-7">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
