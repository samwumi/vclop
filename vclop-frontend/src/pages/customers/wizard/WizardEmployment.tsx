import { useFormContext } from 'react-hook-form';

export function WizardEmployment() {
  const { register } = useFormContext();
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Employment & Income</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Employer / Business Name</label>
          <input className="form-input" {...register('employerName')} />
        </div>
        <div>
          <label className="form-label">Employment Type</label>
          <select className="form-input" {...register('employmentType')}>
            <option value="">Select…</option>
            <option value="EMPLOYED">Employed</option>
            <option value="SELF_EMPLOYED">Self-Employed</option>
            <option value="BUSINESS_OWNER">Business Owner</option>
            <option value="UNEMPLOYED">Unemployed</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Job Title</label>
          <input className="form-input" {...register('jobTitle')} />
        </div>
        <div>
          <label className="form-label">Monthly Income (PHP)</label>
          <input type="number" className="form-input" placeholder="0.00" {...register('monthlyIncome', { valueAsNumber: true })} />
        </div>
      </div>
      <div>
        <label className="form-label">Employment Start Date</label>
        <input type="date" className="form-input" {...register('employmentStartDate')} />
      </div>
    </div>
  );
}
