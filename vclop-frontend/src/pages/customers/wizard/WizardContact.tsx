import { useFormContext } from 'react-hook-form';

export function WizardContact() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Contact Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Primary Phone</label>
          <input className="form-input" placeholder="+63 9XX XXX XXXX" {...register('primaryPhone')} />
        </div>
        <div>
          <label className="form-label">Secondary Phone</label>
          <input className="form-input" placeholder="+63 9XX XXX XXXX" {...register('secondaryPhone')} />
        </div>
      </div>
      <div>
        <label className="form-label">Email Address</label>
        <input type="email" className="form-input" placeholder="juan@email.com" {...register('email')} />
        {errors.email && <p className="form-error">{String(errors.email.message)}</p>}
      </div>
    </div>
  );
}
