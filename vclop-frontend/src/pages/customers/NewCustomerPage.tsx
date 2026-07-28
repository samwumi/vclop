import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { customersService } from '@/services/customers.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';

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

const EMPTY: FormState = {
  type: 'INDIVIDUAL', firstName: '', lastName: '', middleName: '', businessName: '',
  gender: '', dateOfBirth: '', phone: '', alternatePhone: '', email: '',
  bvn: '', nin: '', residentialAddress: '', businessAddress: '', branchId: '',
};

export function NewCustomerPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['branches', 'locations'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Branch[]>>('/branches/locations');
      return data.data ?? [];
    },
    staleTime: 0,
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        type: form.type,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      };
      if (form.middleName) payload.middleName = form.middleName;
      if (form.type === 'BUSINESS' && form.businessName) payload.businessName = form.businessName;
      if (form.gender) payload.gender = form.gender;
      if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
      if (form.alternatePhone) payload.alternatePhone = form.alternatePhone;
      if (form.email) payload.email = form.email;
      if (form.bvn) payload.bvn = form.bvn;
      if (form.nin) payload.nin = form.nin;
      if (form.residentialAddress) payload.residentialAddress = form.residentialAddress;
      if (form.businessAddress) payload.businessAddress = form.businessAddress;
      if (form.branchId) payload.branchId = form.branchId;
      return customersService.create(payload);
    },
    onSuccess: (customer) => {
      toast.success(`Customer ${customer.customerNumber} registered successfully`);
      qc.invalidateQueries({ queryKey: ['customers'] });
      navigate(`/customers/${customer.id}`);
    },
    onError: (err: unknown) => {
      const response = (err as { response?: { data?: { message?: string; errors?: { field: string; message: string }[] } } })?.response;
      const fieldErrors: Record<string, string> = {};
      response?.data?.errors?.forEach((e) => { fieldErrors[e.field] = e.message; });
      setErrors(fieldErrors);
      toast.error(response?.data?.message ?? 'Registration failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    mutation.mutate();
  };

  const Input = ({ label, field, type = 'text', required = false }: { label: string; field: keyof FormState; type?: string; required?: boolean }) => (
    <div>
      <label className="form-label text-xs">{label}{required && ' *'}</label>
      <input
        type={type}
        className="form-input"
        value={form[field]}
        onChange={(e) => set(field, e.target.value as never)}
        required={required}
      />
      {errors[field] && <p className="text-xs text-red-500 mt-0.5">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumbs />
      <div className="page-header">
        <h1 className="page-title">Register New Customer</h1>
        <p className="text-sm text-gray-500">Core identity details. Additional information can be added from the customer's profile after registration.</p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-5">
          <div>
            <label className="form-label text-xs">Customer Type *</label>
            <select className="form-input" value={form.type} onChange={(e) => set('type', e.target.value as FormState['type'])}>
              <option value="INDIVIDUAL">Individual</option>
              <option value="BUSINESS">Business</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" field="firstName" required />
            <Input label="Last Name" field="lastName" required />
            <Input label="Middle Name" field="middleName" />
            {form.type === 'BUSINESS' && <Input label="Business Name" field="businessName" required />}
            <div>
              <label className="form-label text-xs">Gender</label>
              <select className="form-input" value={form.gender} onChange={(e) => set('gender', e.target.value as FormState['gender'])}>
                <option value="">Select…</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <Input label="Date of Birth" field="dateOfBirth" type="date" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" field="phone" required />
            <Input label="Alternate Phone" field="alternatePhone" />
            <Input label="Email" field="email" type="email" />
            <Input label="BVN" field="bvn" />
            <Input label="NIN" field="nin" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Input label="Residential Address" field="residentialAddress" />
            {form.type === 'BUSINESS' && <Input label="Business Address" field="businessAddress" />}
            <div>
              <label className="form-label text-xs">Location / Branch <span className="text-red-500">*</span></label>
              <select
                className="form-input"
                value={form.branchId}
                onChange={(e) => set('branchId', e.target.value)}
                required
              >
                <option value="">Select location…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {errors.branchId && <p className="text-xs text-red-500 mt-0.5">{errors.branchId}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => navigate('/customers')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary disabled:opacity-50">
              {mutation.isPending ? 'Registering…' : 'Register Customer'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
