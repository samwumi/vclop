import { useState, useEffect } from 'react';
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
    employerName:       (p?.employerName       as string) ?? (existingValues?.employer_name    as string) ?? '',
    employmentType:     (p?.employmentType     as string) ?? (existingValues?.employment_type  as string) ?? '',
    monthlyIncome:      (p?.monthlyIncome      as string) ?? (existingValues?.monthly_income   as string) ?? '',
    jobTitle:           (p?.jobTitle           as string) ?? (existingValues?.job_title         as string) ?? '',
    employerAddress:    (p?.employerAddress    as string) ?? (existingValues?.employer_address  as string) ?? '',
    employerPhone:      (p?.employerPhone      as string) ?? (existingValues?.employer_phone    as string) ?? '',
    nokName:            (p?.nokName            as string) ?? (existingValues?.nok_name          as string) ?? '',
    nokRelationship:    (p?.nokRelationship    as string) ?? (existingValues?.nok_relationship  as string) ?? '',
    nokPhone:           (p?.nokPhone           as string) ?? (existingValues?.nok_phone         as string) ?? '',
    nokAddress:         (p?.nokAddress         as string) ?? (existingValues?.nok_address       as string) ?? '',
    residentialAddress: p?.residentialAddress ?? '',
    businessAddress:    p?.businessAddress    ?? '',
    bankAccountNumber:  (p?.bankAccountNumber  as string) ?? '',
    bankCode:           (p?.bankCode           as string) ?? '',
  });

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Sync form when parent data loads — read from profile fields directly
  useEffect(() => {
    const p2 = profile as (typeof profile & Record<string, string | null | undefined>) | undefined;
    setForm({
      employerName:       (p2?.employerName       as string) ?? (existingValues?.employer_name    as string) ?? '',
      employmentType:     (p2?.employmentType     as string) ?? (existingValues?.employment_type  as string) ?? '',
      monthlyIncome:      (p2?.monthlyIncome      as string) ?? (existingValues?.monthly_income   as string) ?? '',
      jobTitle:           (p2?.jobTitle           as string) ?? (existingValues?.job_title         as string) ?? '',
      employerAddress:    (p2?.employerAddress    as string) ?? (existingValues?.employer_address  as string) ?? '',
      employerPhone:      (p2?.employerPhone      as string) ?? (existingValues?.employer_phone    as string) ?? '',
      nokName:            (p2?.nokName            as string) ?? (existingValues?.nok_name          as string) ?? '',
      nokRelationship:    (p2?.nokRelationship    as string) ?? (existingValues?.nok_relationship  as string) ?? '',
      nokPhone:           (p2?.nokPhone           as string) ?? (existingValues?.nok_phone         as string) ?? '',
      nokAddress:         (p2?.nokAddress         as string) ?? (existingValues?.nok_address       as string) ?? '',
      residentialAddress: p2?.residentialAddress ?? '',
      businessAddress:    p2?.businessAddress    ?? '',
      bankAccountNumber:  (p2?.bankAccountNumber  as string) ?? '',
      bankCode:           (p2?.bankCode           as string) ?? '',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingValues, profile]);

  const canEdit = hasPermission('customers:update') || hasPermission('customers:create');

  // Check if any data has been filled — includes both form submissions AND profile fields
  const hasData = !!(
    form.employerName || form.employmentType || form.monthlyIncome ||
    form.jobTitle || form.nokName || form.nokPhone ||
    form.residentialAddress || form.businessAddress ||
    form.employerAddress || form.employerPhone ||
    form.nokRelationship || form.nokAddress
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save all fields directly to customer profile — no form template dependency
      await customersService.update(customerId, {
        residentialAddress: form.residentialAddress || undefined,
        businessAddress:    form.businessAddress    || undefined,
        employerName:       form.employerName       || undefined,
        employmentType:     form.employmentType     || undefined,
        jobTitle:           form.jobTitle           || undefined,
        monthlyIncome:      form.monthlyIncome ? Number(form.monthlyIncome) : undefined,
        employerPhone:      form.employerPhone      || undefined,
        employerAddress:    form.employerAddress    || undefined,
        nokName:            form.nokName            || undefined,
        nokRelationship:    form.nokRelationship    || undefined,
        nokPhone:           form.nokPhone           || undefined,
        nokAddress:         form.nokAddress         || undefined,
        bankAccountNumber:  form.bankAccountNumber  || undefined,
        bankCode:           form.bankCode           || undefined,
      });
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

        {/* Bank Account — for virtual account creation */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-800">Bank Account</h3>
            <span className="text-xs text-gray-400 ml-1">(required for virtual account)</span>
          </div>
          <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            {form.bankAccountNumber ? (
              <>
                <Field label="Account Number" value={form.bankAccountNumber} />
                <Field label="Bank Code (CBN)" value={form.bankCode} />
              </>
            ) : (
              <p className="text-sm text-gray-400 italic col-span-2">
                No bank account recorded yet.
                {canEdit && ' Click "Edit" above to fill in.'}
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

      {/* Bank Account — required for Paystack virtual account creation */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-gray-800">Bank Account</h3>
          <span className="text-xs text-gray-400 ml-1">— required for virtual account creation</span>
        </div>
        <div className="card-body">
          <p className="text-xs text-gray-500 mb-3">
            The customer's own bank account number and bank code are used to verify their BVN with
            Paystack before assigning a dedicated virtual account for loan repayment.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label text-xs">Account Number (10 digits)</label>
              <input
                className="form-input"
                value={form.bankAccountNumber}
                onChange={e => set('bankAccountNumber', e.target.value)}
                placeholder="e.g. 0123456789"
                maxLength={10}
              />
            </div>
            <div>
              <label className="form-label text-xs">Bank</label>
              <select
                className="form-input"
                value={form.bankCode}
                onChange={e => set('bankCode', e.target.value)}
              >
                <option value="">-- Select Bank --</option>
                <optgroup label="Commercial Banks">
                  <option value="044">Access Bank (044)</option>
                  <option value="011">First Bank of Nigeria (011)</option>
                  <option value="058">Guaranty Trust Bank - GTBank (058)</option>
                  <option value="057">Zenith Bank (057)</option>
                  <option value="033">United Bank for Africa - UBA (033)</option>
                  <option value="214">First City Monument Bank - FCMB (214)</option>
                  <option value="070">Fidelity Bank (070)</option>
                  <option value="221">Stanbic IBTC Bank (221)</option>
                  <option value="232">Sterling Bank (232)</option>
                  <option value="032">Union Bank of Nigeria (032)</option>
                  <option value="035">Wema Bank (035)</option>
                  <option value="050">Ecobank Nigeria (050)</option>
                  <option value="030">Heritage Bank (030)</option>
                  <option value="082">Keystone Bank (082)</option>
                  <option value="076">Polaris Bank (076)</option>
                  <option value="101">Providus Bank (101)</option>
                  <option value="215">Unity Bank (215)</option>
                  <option value="023">Citibank Nigeria (023)</option>
                  <option value="068">Standard Chartered Bank (068)</option>
                  <option value="102">Titan Trust Bank (102)</option>
                  <option value="100">SunTrust Bank (100)</option>
                  <option value="00103">Globus Bank (00103)</option>
                </optgroup>
                <optgroup label="Fintech Banks (OPay, PalmPay, Kuda, etc.)">
                  <option value="999992">OPay (999992)</option>
                  <option value="999991">PalmPay (999991)</option>
                  <option value="50211">Kuda Bank (50211)</option>
                  <option value="50515">Moniepoint (50515)</option>
                  <option value="565">Carbon (565)</option>
                  <option value="125">Rubies Bank (125)</option>
                  <option value="566">VFD Microfinance Bank (566)</option>
                </optgroup>
                <optgroup label="Microfinance Banks">
                  <option value="50563">LAPO Microfinance Bank (50563)</option>
                  <option value="602">Accion Microfinance Bank (602)</option>
                  <option value="51204">AB Microfinance Bank (51204)</option>
                  <option value="551">Covenant Microfinance Bank (551)</option>
                  <option value="562">Ekondo Microfinance Bank (562)</option>
                  <option value="608">Fina Trust Microfinance Bank (608)</option>
                  <option value="501">Fortis Microfinance Bank (501)</option>
                  <option value="51244">IBILE Microfinance Bank (51244)</option>
                  <option value="50457">Infinity MFB (50457)</option>
                  <option value="50552">Mutual Benefits MFB (50552)</option>
                  <option value="552">NPF Microfinance Bank (552)</option>
                  <option value="50767">Regent Microfinance Bank (50767)</option>
                  <option value="50994">Rephidim Microfinance Bank (50994)</option>
                  <option value="50746">Page Financials (50746)</option>
                </optgroup>
              </select>
              <p className="form-hint">Select the customer's bank. Includes OPay, PalmPay, Kuda, and all Nigerian banks.</p>
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
