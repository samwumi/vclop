import { useFormContext } from 'react-hook-form';
import { CheckCircle2 } from 'lucide-react';

export function WizardReview() {
  const { watch } = useFormContext();
  const v = watch();

  const Section = ({ title, items }: { title: string; items: [string, unknown][] }) => (
    <div className="mb-5">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{title}</h4>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        {items.filter(([, val]) => val !== undefined && val !== null && val !== '').map(([label, val]) => (
          <div key={label} className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-gray-500">{label}: </span>
              <span className="text-xs font-medium text-gray-800">{String(val)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Review & Submit</p>
          <p className="text-xs text-gray-500">Please verify all information before registering</p>
        </div>
      </div>

      <Section title="Identity" items={[
        ['Customer Type', (v as { customerTypeId?: string }).customerTypeId],
        ['Full Name', `${(v as { firstName?: string }).firstName ?? ''} ${(v as { middleName?: string }).middleName ?? ''} ${(v as { lastName?: string }).lastName ?? ''}`.trim()],
        ['Gender', (v as { gender?: string }).gender], ['Date of Birth', (v as { dateOfBirth?: string }).dateOfBirth],
        ['Nationality', (v as { nationality?: string }).nationality], ['Marital Status', (v as { maritalStatus?: string }).maritalStatus],
      ]} />

      <Section title="Contact" items={[
        ['Primary Phone', (v as { primaryPhone?: string }).primaryPhone],
        ['Secondary Phone', (v as { secondaryPhone?: string }).secondaryPhone],
        ['Email', (v as { email?: string }).email],
      ]} />

      <Section title="Employment" items={[
        ['Employer', (v as { employerName?: string }).employerName],
        ['Employment Type', (v as { employmentType?: string }).employmentType],
        ['Job Title', (v as { jobTitle?: string }).jobTitle],
        ['Monthly Income', (v as { monthlyIncome?: number }).monthlyIncome ? `PHP ${(v as { monthlyIncome: number }).monthlyIncome.toLocaleString()}` : undefined],
      ]} />

      <Section title="Address" items={[
        ['Address', `${(v as { addressLine1?: string }).addressLine1 ?? ''} ${(v as { city?: string }).city ?? ''} ${(v as { state?: string }).state ?? ''}`.trim()],
        ['Country', (v as { country?: string }).country], ['Postal Code', (v as { postalCode?: string }).postalCode],
      ]} />

      <Section title="Next of Kin" items={[
        ['Name', `${(v as { nokFirstName?: string }).nokFirstName ?? ''} ${(v as { nokLastName?: string }).nokLastName ?? ''}`.trim()],
        ['Relationship', (v as { nokRelationship?: string }).nokRelationship],
        ['Phone', (v as { nokPhone?: string }).nokPhone],
      ]} />

      <Section title="Government IDs" items={[
        ['BVN', (v as { bvn?: string }).bvn], ['NIN', (v as { nin?: string }).nin],
        ['Passport', (v as { passportNumber?: string }).passportNumber], ["Driver's License", (v as { driversLicense?: string }).driversLicense],
      ]} />

      <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-700">
          By submitting, you confirm that all information is accurate. The customer record can be updated later.
        </p>
      </div>
    </div>
  );
}
