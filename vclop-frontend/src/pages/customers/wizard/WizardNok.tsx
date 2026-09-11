import { useFormContext } from 'react-hook-form';

export function WizardNok() {
  const { register } = useFormContext();
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Next of Kin</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">First Name</label>
          <input className="form-input" {...register('nokFirstName')} />
        </div>
        <div>
          <label className="form-label">Last Name</label>
          <input className="form-input" {...register('nokLastName')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Relationship</label>
          <select className="form-input" {...register('nokRelationship')}>
            <option value="">Select…</option>
            <option value="SPOUSE">Spouse</option>
            <option value="PARENT">Parent</option>
            <option value="SIBLING">Sibling</option>
            <option value="CHILD">Child</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="form-label">Phone</label>
          <input className="form-input" {...register('nokPhone')} />
        </div>
      </div>
      <div>
        <label className="form-label">Email</label>
        <input type="email" className="form-input" {...register('nokEmail')} />
      </div>
    </div>
  );
}
