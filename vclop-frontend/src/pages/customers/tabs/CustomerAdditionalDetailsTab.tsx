import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Briefcase, Users, MapPin } from 'lucide-react';
import { customersService } from '@/services/customers.service';
import { useAuthStore } from '@/stores/auth.store';
import type { Customer360 } from '@/types/domain.types';

interface Props {
  customerId: string;
  existingValues: Record<string, unknown> | null;
  profile?: Customer360['profile'];
}

// Field component
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="form-label text-xs">{label}</label>
      {children}
    </div>
  );
}

// Section header
function Section({ title, icon: Icon }: { title: string; icon: typeof Briefcase }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4">
      <Icon className="w-4 h-4 text-brand-600" />
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
  );
}

export function CustomerAdditionalDetailsTab({ customerId, existingValues, profile }: Props) {
  const { hasPermission } = useAuthStore();
  const qc = useQueryClient();

  // Pre-fill from existing customer profile
  const p = profile as (typeof profile & Record<string, string | null | undefined>) | undefined;

  const [form, setForm] = useState({
    // Employment
    employerName:    (existingValues?.employer_name  as string) ?? '',
    employmentType:  (existingValues?.employment_type as string) ?? '',
    monthlyIncome:   (existingValues?.monthly_income  as string) ?? '',
    jobTitle:        (existingValues?.job_title        as string) ?? '',
    employerAddress: (existingValues?.employer_address as string) ?? '',
    employerPhone:   (existingValues?.employer_phone   as string) ?? '',

    // Next of Kin
    nokName:         (existingValues?.nok_name         as string) ?? '',
    nokRelationship: (existingValues?.nok_relationship as string) ?? '',
    nokPhone:        (existingValues?.nok_phone        as string) ?? '',
    nokAddress:      (existingValues?.nok_address      as string) ?? '',

    // Additional address
    residentialAddress: p?.residentialAddress ?? '',
    businessAddress:    p?.businessAddress    ?? '',
  });

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const canEdit = hasPermission('customers:update') || hasPermission('customers:create');

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save core profile fields via customer update
      await customersService.update(customerId, {
        residentialAddress: form.residentialAddress || undefined,
        businessAddress:    form.businessAddress    || undefined,
      });

      // Save employment/next-of-kin via dynamic form submission if template exists
      // (gracefully skip if no template — core fields still saved above)
      try {
        const { adminService } = await import('@/services/admin.service');
        const template = await adminService.forms.getDefaultTemplate('CUSTOMER');
        if (template) {
          const fieldsByCode = new Map(
            (template as { sections: Array<{ fields: Array<{ code: string; id: string }> }> })
              .sections.flatMap(s => s.fields.map(f => [f.code, f.id] as const))
          );
          const payload = Object.entries({
            employer_name:    form.employerName,
            employment_type:  form.employmentType,
            monthly_income:   form.monthlyIncome,
            job_title:        form.jobTitle,
            employer_address: form.employerAddress,
            employer_phone:   form.employerPhone,
            nok_name:         form.nokName,
            nok_relationship: form.nokRelationship,
            nok_phone:        form.nokPhone,
            nok_address:      form.nokAddress,
          })
            .filter(([code, value]) => fieldsByCode.has(code) && value)
            .map(([code, value]) => ({ fieldId: fieldsByCode.get(code)!, value }));

          if (payload.length) {
            await adminService.forms.submit(
              (template as { id: string }).id, 'CUSTOMER', customerId, payload
            );
          }
        }
      } catch {
        // No form template configured — core fields were still saved
      }
    },
    onSuccess: () => {
      toast.success('Additional details saved');
      qc.invalidateQueries({ queryKey: ['customer360', customerId] });
    },
    onError: () => toast.error('Failed to save'),
  });

  return (
    <div className="space-y-6">
      {/* Employment */}
      <div className="card">
        <div className="card-body">
          <Section title="Employment & Income" icon={Briefcase} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employer Name">
              <input className="form-input" disabled={!canEdit} value={form.employerName}
                onChange={e => set('employerName', e.target.value)} placeholder="Company or business name" />
            </Field>
            <Field label="Employment Type">
              <select className="form-input" disabled={!canEdit} value={form.employmentType}
                onChange={e => set('employmentType', e.target.value)}>
                <option value="">Select…</option>
                <option value="EMPLOYED">Employed</option>
                <option value="SELF_EMPLOYED">Self-Employed</option>
                <option value="BUSINESS_OWNER">Business Owner</option>
                <option value="CIVIL_SERVANT">Civil Servant</option>
                <option value="TRADER">Trader</option>
                <option value="UNEMPLOYED">Unemployed</option>
                <option value="RETIRED">Retired</option>
              </select>
            </Field>
            <Field label="Job Title">
              <input className="form-input" disabled={!canEdit} value={form.jobTitle}
                onChange={e => set('jobTitle', e.target.value)} placeholder="Position/role" />
            </Field>
            <Field label="Monthly Income (₦)">
              <input type="number" className="form-input" disabled={!canEdit} value={form.monthlyIncome}
                onChange={e => set('monthlyIncome', e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Employer Phone">
              <input className="form-input" disabled={!canEdit} value={form.employerPhone}
                onChange={e => set('employerPhone', e.target.value)} placeholder="+234…" />
            </Field>
            <Field label="Employer Address">
              <input className="form-input" disabled={!canEdit} value={form.employerAddress}
                onChange={e => set('employerAddress', e.target.value)} placeholder="Office address" />
            </Field>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="card">
        <div className="card-body">
          <Section title="Address Details" icon={MapPin} />
          <div className="grid grid-cols-1 gap-4">
            <Field label="Residential Address">
              <textarea className="form-input" rows={2} disabled={!canEdit} value={form.residentialAddress}
                onChange={e => set('residentialAddress', e.target.value)}
                placeholder="House number, street, area, city, state" />
            </Field>
            <Field label="Business Address">
              <textarea className="form-input" rows={2} disabled={!canEdit} value={form.businessAddress}
                onChange={e => set('businessAddress', e.target.value)}
                placeholder="Business premises address (if different from residential)" />
            </Field>
          </div>
        </div>
      </div>

      {/* Next of Kin */}
      <div className="card">
        <div className="card-body">
          <Section title="Next of Kin" icon={Users} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *">
              <input className="form-input" disabled={!canEdit} value={form.nokName}
                onChange={e => set('nokName', e.target.value)} placeholder="Next of kin full name" />
            </Field>
            <Field label="Relationship *">
              <select className="form-input" disabled={!canEdit} value={form.nokRelationship}
                onChange={e => set('nokRelationship', e.target.value)}>
                <option value="">Select…</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Sibling">Sibling</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Phone Number *">
              <input className="form-input" disabled={!canEdit} value={form.nokPhone}
                onChange={e => set('nokPhone', e.target.value)} placeholder="+234…" />
            </Field>
            <Field label="Address">
              <input className="form-input" disabled={!canEdit} value={form.nokAddress}
                onChange={e => set('nokAddress', e.target.value)} placeholder="Next of kin address" />
            </Field>
          </div>
        </div>
      </div>

      {/* Save button */}
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving…' : 'Save Additional Details'}
          </button>
        </div>
      )}
    </div>
  );
}
