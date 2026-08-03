import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { customersService } from '@/services/customers.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { Customer } from '@/types/domain.types';

interface Branch { id: string; code: string; name: string; }

type FormState = {
  type: 'INDIVIDUAL' | 'BUSINESS';
  firstName: string;
  lastName: string;
  middleName: string;
  businessName: string;
  gender: '' | 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  phone: string;
  alternatePhone: string;
  email: string;
  bvn: string;
  nin: string;
  residentialAddress: string;
  businessAddress: string;
  branchId: string;
};

function FormField({
  label, type = 'text', required = false, value, error, onChange,
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="form-label text-xs">{label}{required && ' *'}</label>
      <input
        type={type}
        className="form-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

export function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>({
    type: 'INDIVIDUAL', firstName: '', lastName: '', middleName: '',
    businessName: '', gender: '', dateOfBirth: '', phone: '',
    alternatePhone: '', email: '', bvn: '', nin: '',
    residentialAddress: '', businessAddress: '', branchId: '',
  });

  // Load existing customer data
  const { data, isLoading } = useQuery({
    queryKey: ['customer360', id],
    queryFn: () => customersService.get(id!),
    enabled: !!id,
  });

  // Pre-fill form once data arrives
  useEffect(() => {
    if (!data) return;
    const c = data.profile as Customer;
    setForm({
      type: c.type ?? 'INDIVIDUAL',
      firstName: c.firstName ?? '',
      lastName: c.lastName ?? '',
      middleName: c.middleName ?? '',
      businessName: c.businessName ?? '',
      gender: (c.gender as FormState['gender']) ?? '',
      dateOfBirth: c.dateOfBirth ? c.dateOfBirth.split('T')[0] : '',
      phone: c.phone ?? '',
      alternatePhone: c.alternatePhone ?? '',
      email: c.email ?? '',
      bvn: c.bvn ?? '',
      nin: c.nin ?? '',
      residentialAddress: c.residentialAddress ?? '',
      businessAddress: c.businessAddress ?? '',
      branchId: (c as unknown as { branchId?: string }).branchId ?? '',
    });
  }, [data]);

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['branches', 'locations'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Branch[]>>('/branches/locations');
      return data.data ?? [];
    },
    staleTime: 0,
  });

  const set = useCallback((key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        type: form.type,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        middleName: form.middleName || undefined,
        businessName: form.businessName || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        alternatePhone: form.alternatePhone || undefined,
        email: form.email || undefined,
        bvn: form.bvn || undefined,
        nin: form.nin || undefined,
        residentialAddress: form.residentialAddress || undefined,
        businessAddress: form.businessAddress || undefined,
        branchId: form.branchId || undefined,
      };
      return customersService.update(id!, payload);
    },
    onSuccess: (customer) => {
      toast.success(`Customer ${(customer as Customer).customerNumber} updated`);
      qc.invalidateQueries({ queryKey: ['customer360', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      navigate(`/customers/${id}`);
    },
    onError: (err: unknown) => {
      const response = (err as { response?: { data?: { message?: string; errors?: { field: string; message: string }[] } } })?.response;
      const fieldErrors: Record<string, string> = {};
      response?.data?.errors?.forEach((e) => { fieldErrors[e.field] = e.message; });
      setErrors(fieldErrors);
      toast.error(response?.data?.message ?? 'Update failed');
    },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumbs />
      <div className="page-header">
        <h1 className="page-title">Edit Customer</h1>
        <p className="text-sm text-gray-500">Update customer identity details.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setErrors({}); mutation.mutate(); }} className="card">
        <div className="card-body space-y-5">

          {/* Customer type */}
          <div>
            <label className="form-label text-xs">Customer Type *</label>
            <select className="form-input" value={form.type} onChange={(e) => set('type', e.target.value as FormState['type'])}>
              <option value="INDIVIDUAL">Individual</option>
              <option value="BUSINESS">Business</option>
            </select>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" required value={form.firstName} error={errors.firstName} onChange={(v) => set('firstName', v)} />
            <FormField label="Last Name" required value={form.lastName} error={errors.lastName} onChange={(v) => set('lastName', v)} />
            <FormField label="Middle Name" value={form.middleName} error={errors.middleName} onChange={(v) => set('middleName', v)} />
            {form.type === 'BUSINESS' && (
              <FormField label="Business Name" required value={form.businessName} error={errors.businessName} onChange={(v) => set('businessName', v)} />
            )}
            <div>
              <label className="form-label text-xs">Gender</label>
              <select className="form-input" value={form.gender} onChange={(e) => set('gender', e.target.value as FormState['gender'])}>
                <option value="">Select…</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <FormField label="Date of Birth" type="date" value={form.dateOfBirth} error={errors.dateOfBirth} onChange={(v) => set('dateOfBirth', v)} />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phone" required value={form.phone} error={errors.phone} onChange={(v) => set('phone', v)} />
            <FormField label="Alternate Phone" value={form.alternatePhone} error={errors.alternatePhone} onChange={(v) => set('alternatePhone', v)} />
            <FormField label="Email" type="email" value={form.email} error={errors.email} onChange={(v) => set('email', v)} />
            <FormField label="BVN" value={form.bvn} error={errors.bvn} onChange={(v) => set('bvn', v)} />
            <FormField label="NIN" value={form.nin} error={errors.nin} onChange={(v) => set('nin', v)} />
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 gap-4">
            <FormField label="Residential Address" value={form.residentialAddress} error={errors.residentialAddress} onChange={(v) => set('residentialAddress', v)} />
            {form.type === 'BUSINESS' && (
              <FormField label="Business Address" value={form.businessAddress} error={errors.businessAddress} onChange={(v) => set('businessAddress', v)} />
            )}
            <div>
              <label className="form-label text-xs">Location / Branch</label>
              <select className="form-input" value={form.branchId} onChange={(e) => set('branchId', e.target.value)}>
                <option value="">Select location…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {errors.branchId && <p className="text-xs text-red-500 mt-0.5">{errors.branchId}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => navigate(`/customers/${id}`)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary disabled:opacity-50">
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
