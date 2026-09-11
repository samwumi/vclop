import { useState, useCallback, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { customersService } from '@/services/customers.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
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
  // NDPA Consent
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  creditBureauConsent: boolean;
  thirdPartyDataSharingConsent: boolean;
};

const EMPTY: FormState = {
  type: 'INDIVIDUAL', firstName: '', lastName: '', middleName: '', businessName: '',
  gender: '', dateOfBirth: '', phone: '', alternatePhone: '', email: '',
  bvn: '', nin: '', residentialAddress: '', businessAddress: '', branchId: '',
  dataProcessingConsent: false, marketingConsent: false, creditBureauConsent: false, thirdPartyDataSharingConsent: false,
};

// FormField is defined OUTSIDE the component so its reference is stable
// across renders — this prevents React from unmounting/remounting inputs
// on every keystroke (which causes focus loss).
const FormField = memo(function FormField({
  label, field, type = 'text', required = false, value, error, onChange,
}: {
  label: string;
  field: keyof FormState;
  type?: string;
  required?: boolean;
  value: string;
  error?: string;
  onChange: (field: keyof FormState, value: string) => void;
}) {
  return (
    <div>
      <label className="form-label text-xs">{label}{required && ' *'}</label>
      <input
        type={type}
        className="form-input"
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        required={required}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
});

export function NewCustomerPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['branches', 'locations'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Branch[]>>('/branches/locations');
      return data.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    // Pre-select officer's branch once branches load
    select: (data) => {
      // Side-effect: set branchId to officer's branch if not already set
      return data;
    },
  });

  // Pre-select the logged-in officer's branch
  useEffect(() => {
    if (user?.branchId && !form.branchId && branches.length > 0) {
      const myBranch = branches.find(b => b.id === user.branchId);
      if (myBranch) {
        setForm(f => ({ ...f, branchId: myBranch.id }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, user?.branchId]);

  // Stable setter — passed as prop to FormField, won't change on re-renders
  const handleFieldChange = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        type: form.type,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        // NDPA Consent (required)
        dataProcessingConsent: form.dataProcessingConsent,
        creditBureauConsent: form.creditBureauConsent,
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
      // Optional consent
      if (form.marketingConsent) payload.marketingConsent = form.marketingConsent;
      if (form.thirdPartyDataSharingConsent) payload.thirdPartyDataSharingConsent = form.thirdPartyDataSharingConsent;
      return customersService.create(payload);
    },
    onSuccess: (customer) => {
      toast.success(`Customer ${customer.customerNumber} registered successfully`);
      qc.invalidateQueries({ queryKey: ['customers'] });
      // Go directly to Additional Details tab so officer can fill employment/NOK info
      navigate(`/customers/${customer.id}?tab=details`);
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

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumbs />
      <div className="page-header">
        <h1 className="page-title">Register New Customer</h1>
        <p className="text-sm text-gray-500">Core identity details. Additional information can be added from the customer's profile after registration.</p>
      </div>

      <div className="banner-info mb-4 text-xs">
        <strong>Required fields:</strong> First name · Last name · Phone · BVN · NIN · Location · Data Processing Consent · Credit Bureau Consent.
        Additional details (employment, next of kin) can be completed from the customer profile after registration.
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-5">
          <div>
            <label className="form-label text-xs">Customer Type *</label>
            <select className="form-input" value={form.type} onChange={(e) => handleFieldChange('type', e.target.value as FormState['type'])}>
              <option value="INDIVIDUAL">Individual</option>
              <option value="BUSINESS">Business</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" field="firstName" required value={form.firstName} error={errors.firstName} onChange={handleFieldChange} />
            <FormField label="Last Name" field="lastName" required value={form.lastName} error={errors.lastName} onChange={handleFieldChange} />
            <FormField label="Middle Name" field="middleName" value={form.middleName} error={errors.middleName} onChange={handleFieldChange} />
            {form.type === 'BUSINESS' && <FormField label="Business Name" field="businessName" required value={form.businessName} error={errors.businessName} onChange={handleFieldChange} />}
            <div>
              <label className="form-label text-xs">Gender</label>
              <select className="form-input" value={form.gender} onChange={(e) => handleFieldChange('gender', e.target.value as FormState['gender'])}>
                <option value="">Select…</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <FormField label="Date of Birth" field="dateOfBirth" type="date" value={form.dateOfBirth} error={errors.dateOfBirth} onChange={handleFieldChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phone" field="phone" required value={form.phone} error={errors.phone} onChange={handleFieldChange} />
            <FormField label="Alternate Phone" field="alternatePhone" value={form.alternatePhone} error={errors.alternatePhone} onChange={handleFieldChange} />
            <FormField label="Email" field="email" type="email" value={form.email} error={errors.email} onChange={handleFieldChange} />
            <FormField label="BVN (11 digits)" field="bvn" required value={form.bvn} error={errors.bvn} onChange={handleFieldChange} />
            <FormField label="NIN (11 digits)" field="nin" required value={form.nin} error={errors.nin} onChange={handleFieldChange} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <FormField label="Residential Address" field="residentialAddress" value={form.residentialAddress} error={errors.residentialAddress} onChange={handleFieldChange} />
            {form.type === 'BUSINESS' && <FormField label="Business Address" field="businessAddress" value={form.businessAddress} error={errors.businessAddress} onChange={handleFieldChange} />}
            <div>
              <label className="form-label text-xs">Location / Branch <span className="text-red-500">*</span></label>
              <select
                className="form-input"
                value={form.branchId}
                onChange={(e) => handleFieldChange('branchId', e.target.value)}
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

          {/* NDPA Consent Section */}
          <div className="border-t border-gray-200 pt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Data Privacy & Consent (NDPA)</h3>
            <p className="text-xs text-gray-600 mb-4">
              In compliance with the Nigerian Data Protection Act (NDPA) 2023, customer consent is required for data processing.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="dataProcessingConsent"
                  checked={form.dataProcessingConsent}
                  onChange={(e) => handleFieldChange('dataProcessingConsent', e.target.checked)}
                  className="mt-1"
                  required
                />
                <label htmlFor="dataProcessingConsent" className="text-xs text-gray-700 cursor-pointer">
                  <span className="font-semibold text-red-600">*</span> I consent to Vertical Capital processing my personal data (name, phone, email, BVN, NIN, address, employment, financial information) for loan application assessment, customer relationship management, and regulatory compliance as outlined in the Privacy Policy.
                </label>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="creditBureauConsent"
                  checked={form.creditBureauConsent}
                  onChange={(e) => handleFieldChange('creditBureauConsent', e.target.checked)}
                  className="mt-1"
                  required
                />
                <label htmlFor="creditBureauConsent" className="text-xs text-gray-700 cursor-pointer">
                  <span className="font-semibold text-red-600">*</span> I consent to credit bureau checks (CRC Credit Bureau, FirstCentral, etc.) to verify my credit history and assess loan eligibility.
                </label>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="marketingConsent"
                  checked={form.marketingConsent}
                  onChange={(e) => handleFieldChange('marketingConsent', e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="marketingConsent" className="text-xs text-gray-700 cursor-pointer">
                  I consent to receive promotional communications (SMS, email, WhatsApp) about new loan products and special offers. (Optional)
                </label>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="thirdPartyDataSharingConsent"
                  checked={form.thirdPartyDataSharingConsent}
                  onChange={(e) => handleFieldChange('thirdPartyDataSharingConsent', e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="thirdPartyDataSharingConsent" className="text-xs text-gray-700 cursor-pointer">
                  I consent to sharing my data with third-party service providers (payment processors, collection agents) as needed for loan servicing. (Optional)
                </label>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              You have the right to withdraw consent, request data deletion, or access your data at any time. Contact compliance@verticalcapital.ng for data subject requests.
            </p>
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
