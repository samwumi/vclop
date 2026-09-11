import { useFormContext } from 'react-hook-form';

export function WizardAddress() {
  const { register } = useFormContext();
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Residential Address</h3>
      <div>
        <label className="form-label">Address Line 1</label>
        <input className="form-input" placeholder="House/Unit No., Street" {...register('addressLine1')} />
      </div>
      <div>
        <label className="form-label">Address Line 2</label>
        <input className="form-input" placeholder="Barangay, Subdivision" {...register('addressLine2')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">City / Municipality</label>
          <input className="form-input" {...register('city')} />
        </div>
        <div>
          <label className="form-label">Province / State</label>
          <input className="form-input" {...register('state')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Country</label>
          <input className="form-input" {...register('country')} />
        </div>
        <div>
          <label className="form-label">Postal Code</label>
          <input className="form-input" {...register('postalCode')} />
        </div>
      </div>
    </div>
  );
}
