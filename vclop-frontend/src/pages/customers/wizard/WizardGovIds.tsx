import { useFormContext } from 'react-hook-form';

export function WizardGovIds() {
  const { register } = useFormContext();
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Government IDs</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">BVN</label>
          <input className="form-input" maxLength={11} {...register('bvn')} />
          <p className="form-hint">11 digits</p>
        </div>
        <div>
          <label className="form-label">NIN</label>
          <input className="form-input" maxLength={11} {...register('nin')} />
          <p className="form-hint">11 digits</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Passport Number</label>
          <input className="form-input" {...register('passportNumber')} />
        </div>
        <div>
          <label className="form-label">Driver's License</label>
          <input className="form-input" {...register('driversLicense')} />
        </div>
      </div>
    </div>
  );
}
