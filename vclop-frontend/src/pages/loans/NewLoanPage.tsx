import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import { loansService } from '@/services/loans.service';
import { adminService } from '@/services/admin.service';
import { customersService } from '@/services/customers.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import { SearchBar } from '@/components/ui/SearchBar';
import type { Customer, LoanProduct } from '@/types/domain.types';

const schema = z.object({
  customerId:    z.string().min(1, 'Customer is required'),
  loanProductId: z.string().min(1, 'Loan product is required'),
  amount:        z.number().min(1, 'Amount is required'),
  tenureDays:    z.number().min(1, 'Tenure is required'),
  purpose:       z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function NewLoanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data: products } = useQuery({
    queryKey: ['admin', 'loan-products', 'active'],
    queryFn: () => adminService.loanProducts.list({ isActive: true }) as Promise<LoanProduct[]>,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['customers', 'search', customerSearch],
    queryFn: () => customersService.search(customerSearch, 8),
    enabled: customerSearch.length >= 2 && !selectedCustomer,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerId: searchParams.get('customerId') ?? '' },
  });

  const watchProductId = watch('loanProductId');
  const selectedProduct = (products ?? []).find((p) => p.id === watchProductId);

  // Load pre-selected customer from query param
  useEffect(() => {
    const cid = searchParams.get('customerId');
    if (cid && !selectedCustomer) {
      customersService.get(cid).then((c) => { setSelectedCustomer(c.profile); setValue('customerId', c.profile.id); }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => loansService.create(values),
    onSuccess: (loan) => {
      toast.success(`Application ${loan.applicationNumber} created`);
      qc.invalidateQueries({ queryKey: ['loans'] });
      navigate(`/loans/${loan.id}`);
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create application'),
  });

  return (
    <div className="max-w-2xl mx-auto">
      <Breadcrumbs />
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" /> New Loan Application
        </h1>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        {/* Customer selection */}
        <div className="card">
          <div className="card-header"><h3 className="text-sm font-semibold text-gray-700">Customer</h3></div>
          <div className="card-body space-y-3">
            {selectedCustomer ? (
              <>
                <div className="flex items-center justify-between p-3 bg-brand-50 rounded-lg border border-brand-200">
                  <div>
                    <p className="text-sm font-semibold text-brand-800">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                    <p className="text-xs text-brand-600">{selectedCustomer.customerNumber} · {selectedCustomer.phone ?? ''}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedCustomer(null); setValue('customerId', ''); }} className="text-xs text-red-500 hover:underline">Change</button>
                </div>
                {selectedCustomer.status !== 'ELIGIBLE' && selectedCustomer.status !== 'KYC_VERIFIED' && selectedCustomer.status !== 'KYC_PENDING' && selectedCustomer.status !== 'REGISTERED' && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                    ⚠ This customer is <strong>{selectedCustomer.status}</strong> and cannot apply for a loan.
                  </div>
                )}
                {(selectedCustomer.status === 'REGISTERED' || selectedCustomer.status === 'KYC_PENDING') && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-800">
                    ℹ Customer is <strong>{selectedCustomer.status.replace(/_/g, ' ')}</strong>. Compliance will verify KYC and mark Eligible during their review.
                  </div>
                )}
              </>
            ) : (              <div className="relative">
                <SearchBar value={customerSearch} onChange={setCustomerSearch} placeholder="Search by name, phone, customer #…" />
                {(searchResults ?? []).length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {(searchResults ?? []).map((c) => (
                      <button
                        key={c.id} type="button"
                        onClick={() => { setSelectedCustomer(c); setValue('customerId', c.id); setCustomerSearch(''); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                      >
                        <p className="font-medium text-gray-800">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-gray-500">{c.customerNumber} · {c.phone ?? ''}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.customerId && <p className="form-error">{errors.customerId.message}</p>}
          </div>
        </div>

        {/* Loan product */}
        <div className="card">
          <div className="card-header"><h3 className="text-sm font-semibold text-gray-700">Loan Product</h3></div>
          <div className="card-body space-y-4">
            <div>
              <label className="form-label">Product <span className="text-red-500">*</span></label>
              <select className="form-input" {...register('loanProductId')}>
                <option value="">Select product…</option>
                {(products ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.interestRate}% {p.interestType})</option>
                ))}
              </select>
              {errors.loanProductId && <p className="form-error">{errors.loanProductId.message}</p>}
            </div>

            {selectedProduct && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                <div><span className="font-medium">Min:</span> ₦{Number(selectedProduct.minAmount).toLocaleString()}</div>
                <div><span className="font-medium">Max:</span> ₦{Number(selectedProduct.maxAmount).toLocaleString()}</div>
                <div><span className="font-medium">Tenure:</span> {selectedProduct.minTenureDays}–{selectedProduct.maxTenureDays} days</div>
                <div><span className="font-medium">Rate:</span> {selectedProduct.interestRate}% (full tenure)</div>
                <div><span className="font-medium">Processing:</span> {selectedProduct.processingFeeRate}%</div>
                <div><span className="font-medium">Frequency:</span> {selectedProduct.repaymentFrequency}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Amount (₦) <span className="text-red-500">*</span></label>
                <input type="number" className="form-input" placeholder="0.00" {...register('amount', { valueAsNumber: true })} />
                {errors.amount && <p className="form-error">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="form-label">Tenure (days) <span className="text-red-500">*</span></label>
                <input type="number" className="form-input" placeholder="30" {...register('tenureDays', { valueAsNumber: true })} />
                {errors.tenureDays && <p className="form-error">{errors.tenureDays.message}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">Loan Purpose</label>
              <textarea rows={2} className="form-input resize-none" placeholder="Describe the purpose of this loan…" {...register('purpose')} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending || (!!selectedCustomer && !['REGISTERED','KYC_PENDING','KYC_VERIFIED','ELIGIBLE'].includes(selectedCustomer.status))} className="btn-primary gap-2 disabled:opacity-50">
            {mutation.isPending ? <LoadingSpinner className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            {mutation.isPending ? 'Creating…' : 'Create Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
