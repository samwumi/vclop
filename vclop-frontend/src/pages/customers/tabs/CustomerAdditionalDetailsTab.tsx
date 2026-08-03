import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Briefcase, Users, MapPin, Edit, X } from 'lucide-react';
import { customersService } from '@/services/customers.service';
import { useAuthStore } from '@/stores/auth.store';
import type { Customer360 } from '@/types/domain.types';

interface Props {
  customerId: string;
  existingValues: Record<string, unknown> | null;
  profile?: Customer360['profile'];
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  EMPLOYED: 'Employed', SELF_EMPLOYED: 'Self-Employed', BUSINESS_OWNER: 'Business Owner',
  CIVIL_SERVANT: 'Civil Servant', TRADER: 'Trader', UNEMPLOYED: 'Unemployed', RETIRED: 'Retired',
};

// Read-only field
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">
        {value || <span className="text-gray-400 italic">Not provided</span>}
      </p>
    </div>
  );
}

export function CustomerAdditionalDetailsTab({ customerId, existingValues, profile }: Props) {
  const { hasPermission } = useAuthStore();
  const qc = useQueryClient();

  const p = profile as (typeof profile & Record<string, string | null | undefined>) | undefined;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    employerName:       (existingValues?.employer_name    as string) ?? '',
    employmentType:     (existingValues?.employment_type  as string) ?? '',
    monthlyIncome:      (existingValues?.monthly_income   as string) ?? '',
    jobTitle:           (existingValues?.job_title         as string) ?? '',
    employerAddress:    (existingValues?.employer_address  as string) ?? '',
    employerPhone:      (existingValues?.employer_phone    as string) ?? '',
    nokName:            (existingValues?.nok_name          as string) ?? '',
    nokRelationship:    (existingValues?.nok_relationship  as string) ?? '',
    nokPhone:           (existingValues?.nok_phone         as string) ?? '',
    nokAddress:         (existingValues?.nok_address       as string) ?? '',
    residentialAddress: p?.residentialAddress ?? '',
    businessAddress:    p?.businessAddress    ?? '',
  });

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const canEdit = hasPermission('customers:update') || hasPermission('customers:create');

  // Check if any data has been filled
  const hasData = !!(
    form.employerName || form.employmentType || form.monthlyIncome ||
    form.jobTitle || form.nokName || form.nokPhone ||
    form.residentialAddress || form.businessAddress
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      await customersService.update(customerId, {
        residentialAddress: form.residentialAddress || undefined,
        businessAddress:    form.businessAddress    || undefined,
      });

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
        // No form template — core fields already saved
      }
    },
    onSuccess: () => {
      toast.success('Additional details saved');
      qc.invalidateQueries({ queryKey: ['customer360', customerId] });
      setEditing(false);
    },
    onError: () => toast.error('Failed to save'),
  });

  // ── READ-ONLY / SUMMARY VIEW ──────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-6">
        {/* Employment */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-gray-800">Employment & Income</h3>
            </div>
            {canEdit && (
              <button onClick={() => setEditing(true)} className="btn-ghost btn-sm gap-1.5 text-brand-600">
                <Edit className="w-3.5 h-3.5" />
                {hasData ? 'Edit' : 'Add Details'}
              </button>
            )}
          </div>
          <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hasData ? (
              <>
                <Field label="Employer Name"      value={form.employerName} />
                <Field label="Employment Type"    value={EMPLOYMENT_TYPE_LABELS[form.employmentType] ?? form.employmentType} />
                <Field label="Job Title"          value={form.jobTitle} />
                <Field label="Monthly Income (₦)" value={form.monthlyIncome ? `₦${Number(form.monthlyIncome).toLocaleString('en-NG')}` : ''} />
                <Field label="Employer Phone"     value={form.employerPhone} />
                <Field label="Employer Address"   value={form.employerAddress} />
              </>
            ) : (
              <p className="text-sm text-gray-400 italic col-span-2">
                No employment details recorded yet.
                {canEdit && ' Click "Add Details" to fill in.'}
              </p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-800">Address Details</h3>
          </div>
          <div className="card-body grid grid-cols-1 gap-4">
            <Field label="Residential Address" value={form.residentialAddress} />
            <Field label="Business Address"    value={form.businessAddress} />
          </div>
        </div>

        {/* Next of Kin */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-800">Next of Kin</h3>
          </div>
          <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            {form.nokName ? (
              <>
                <Field label="Full Name"    value={form.nokName} />
                <Field label="Relationship" value={form.nokRelationship} />
                <Field label="Phone Number" value={form.nokPhone} />
                <Field label="Address"      value={form.nokAddress} />
              </>
            ) : (
              <p className="text-sm text-gray-400 italic col-span-2">
                No next of kin recorded yet.
                {canEdit && ' Click "Add Details" above to fill in.'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── EDIT VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Employment */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-800">Employment & Income</h3>
          </div>
          <button onClick={() => setEditing(false)} className="btn-ghost btn-sm gap-1.5 text-gray-500">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label text-xs">Employer Name</label>
              <input className="form-input" value={form.employerName}
                onChange={e => set('employerName', e.target.value)} placeholder="Company or business name" />
            </div>
            <div>
              <label className="form-label text-xs">Employment Type</label>
              <select className="form-input" value={form.employmentType}
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
            </div>
            <div>
              <label className="form-label text-xs">Job Title</label>
              <input className="form-input" value={form.jobTitle}
                onChange={e => set('jobTitle', e.target.value)} placeholder="Position/role" />
            </div>
            <div>
              <label className="form-label text-xs">Monthly Income (₦)</label>
              <input type="number" className="form-input" value={form.monthlyIncome}
                onChange={e => set('monthlyIncome', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="form-label text-xs">Employer Phone</label>
              <input className="form-input" value={form.employerPhone}
                onChange={e => set('employerPhone', e.target.value)} placeholder="+234…" />
            </div>
            <div>
              <label className="form-label text-xs">Employer Address</label>
              <input className="form-input" value={form.employerAddress}
                onChange={e => set('employerAddress', e.target.value)} placeholder="Office address" />
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-gray-800">Address Details</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="form-label text-xs">Residential Address</label>
              <textarea className="form-input" rows={2} value={form.residentialAddress}
                onChange={e => set('residentialAddress', e.target.value)}
                placeholder="House number, street, area, city, state" />
            </div>
            <div>
              <label className="form-label text-xs">Business Address</label>
              <textarea className="form-input" rows={2} value={form.businessAddress}
                onChange={e => set('businessAddress', e.target.value)}
                placeholder="Business premises address (if different from residential)" />
            </div>
          </div>
        </div>
      </div>

      {/* Next of Kin */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-gray-800">Next of Kin</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label text-xs">Full Name *</label>
              <input className="form-input" value={form.nokName}
                onChange={e => set('nokName', e.target.value)} placeholder="Next of kin full name" />
            </div>
            <div>
              <label className="form-label text-xs">Relationship *</label>
              <select className="form-input" value={form.nokRelationship}
                onChange={e => set('nokRelationship', e.target.value)}>
                <option value="">Select…</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Sibling">Sibling</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Phone Number *</label>
              <input className="form-input" value={form.nokPhone}
                onChange={e => set('nokPhone', e.target.value)} placeholder="+234…" />
            </div>
            <div>
              <label className="form-label text-xs">Address</label>
              <input className="form-input" value={form.nokAddress}
                onChange={e => set('nokAddress', e.target.value)} placeholder="Next of kin address" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button onClick={() => setEditing(false)} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="btn-primary gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving…' : 'Save Details'}
        </button>
      </div>
    </div>
  );
}
