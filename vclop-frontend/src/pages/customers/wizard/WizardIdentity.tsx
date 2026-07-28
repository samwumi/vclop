import { useFormContext } from 'react-hook-form';

interface Props { customerTypes: { id: string; name: string }[] }

export function WizardIdentity({ customerTypes }: Props) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Identity Information</h3>

      <div>
        <label className="form-label">Customer Type <span className="text-red-500">*</span></label>
        <select className="form-input" {...register('customerTypeId')}>
          <option value="">Select customer type…</option>
          {customerTypes.map((ct) => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
        </select>
        {errors.customerTypeId && <p className="form-error">{String(errors.customerTypeId.message)}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="form-label">First Name <span className="text-red-500">*</span></label>
          <input className="form-input" placeholder="Juan" {...register('firstName')} />
          {errors.firstName && <p className="form-error">{String(errors.firstName.message)}</p>}
        </div>
        <div>
          <label className="form-label">Middle Name</label>
          <input className="form-input" placeholder="dela" {...register('middleName')} />
        </div>
        <div>
          <label className="form-label">Last Name <span className="text-red-500">*</span></label>
          <input className="form-input" placeholder="Cruz" {...register('lastName')} />
          {errors.lastName && <p className="form-error">{String(errors.lastName.message)}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="form-label">Suffix</label>
          <input className="form-input" placeholder="Jr., Sr., III" {...register('suffix')} />
        </div>
        <div>
          <label className="form-label">Gender</label>
          <select className="form-input" {...register('gender')}>
            <option value="">Select…</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="form-label">Date of Birth</label>
          <input type="date" className="form-input" {...register('dateOfBirth')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Nationality</label>
          <input className="form-input" placeholder="Filipino" {...register('nationality')} />
        </div>
        <div>
          <label className="form-label">Marital Status</label>
          <select className="form-input" {...register('maritalStatus')}>
            <option value="">Select…</option>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
            <option value="DIVORCED">Divorced</option>
            <option value="WIDOWED">Widowed</option>
          </select>
        </div>
      </div>
    </div>
  );
}
