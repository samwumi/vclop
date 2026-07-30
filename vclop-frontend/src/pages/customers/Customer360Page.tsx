import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Phone, MapPin, CreditCard, ShieldCheck,
  Clock, FileText, Landmark, Edit, AlertTriangle, Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { customersService } from '@/services/customers.service';
import { virtualAccountsService } from '@/services/virtual-accounts.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate, initials } from '@/lib/utils';
import { CustomerDocumentsTab } from './tabs/CustomerDocumentsTab';
import { CustomerTimelineTab } from './tabs/CustomerTimelineTab';
import { CustomerLoansTab } from './tabs/CustomerLoansTab';
import { CustomerAdditionalDetailsTab } from './tabs/CustomerAdditionalDetailsTab';
import type { Customer, Customer360, CustomerStatus } from '@/types/domain.types';

const STATUS_BADGE: Record<string, { label: string; variant: 'green' | 'red' | 'yellow' | 'blue' | 'gray' }> = {
  PROSPECT:      { label: 'Prospect',      variant: 'gray' },
  REGISTERED:    { label: 'Registered',    variant: 'blue' },
  KYC_PENDING:   { label: 'KYC Pending',   variant: 'yellow' },
  KYC_VERIFIED:  { label: 'KYC Verified',  variant: 'blue' },
  ELIGIBLE:      { label: 'Eligible',      variant: 'green' },
  INELIGIBLE:    { label: 'Ineligible',    variant: 'red' },
  BLACKLISTED:   { label: 'Blacklisted',   variant: 'red' },
};

// Status transitions by role:
// Loan Officers: KYC_PENDING only (flag for compliance review)
// Compliance Officers + Admin: all statuses

const TABS = [
  { id: 'overview',   label: 'Overview',   icon: User },
  { id: 'details',    label: 'Additional Details', icon: FileText },
  { id: 'documents',  label: 'Documents',  icon: FileText },
  { id: 'loans',      label: 'Loans',      icon: Landmark },
  { id: 'timeline',   label: 'Timeline',   icon: Clock },
];

export function Customer360Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Honour ?tab=<id> so NewCustomerPage can land directly on Additional Details
  const initialTab = searchParams.get('tab') ?? 'overview';
  const validTabs = TABS.map(t => t.id);
  const [activeTab, setActiveTab] = useState(validTabs.includes(initialTab) ? initialTab : 'overview');
  const { hasPermission } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customer360', id],
    queryFn: () => customersService.get(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: CustomerStatus) => customersService.updateStatus(id!, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['customer360', id] }); },
    onError: () => toast.error('Failed to update status'),
  });

  if (isLoading) return <PageLoader />;
  if (!data) return null;

  const c = data.profile as Customer;
  const s = STATUS_BADGE[c.status] ?? { label: c.status, variant: 'gray' as const };
  const missingDocs = data.documents.filter((d) => d.status !== 'VERIFIED').length;

  return (
    <div>
      <Breadcrumbs />

      {/* Header card */}
      <div className="card mb-5">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 text-xl font-bold flex items-center justify-center flex-shrink-0">
              {initials(c.firstName, c.lastName)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-gray-900">
                  {c.firstName} {c.middleName ? c.middleName + ' ' : ''}{c.lastName}
                </h1>
                <Badge variant={s.variant}>{s.label}</Badge>
              </div>
              <p className="text-sm text-gray-500 font-mono">{c.customerNumber}</p>
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="flex items-center gap-1 text-xs text-gray-600">
                  <Phone className="w-3 h-3" /> {c.phone}
                </span>
                {c.email && <span className="text-xs text-gray-600">{c.email}</span>}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">Profile Completion</p>
                <p className="text-xl font-bold text-brand-600">{c.profileCompletion}%</p>
              </div>
              <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${c.profileCompletion}%` }} />
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                {/* Apply for Loan — only when ELIGIBLE */}
                {c.status === 'ELIGIBLE' && hasPermission('loan_applications:create') && (
                  <button
                    onClick={() => navigate(`/loans/new?customerId=${id}`)}
                    className="btn-primary btn-sm gap-1.5"
                  >
                    <Landmark className="w-3.5 h-3.5" /> Apply for Loan
                  </button>
                )}
                {hasPermission('customers:update') && (
                  <button onClick={() => navigate(`/customers/${id}/edit`)} className="btn-secondary btn-sm gap-1.5">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>
            </div>
          </div>

          {missingDocs > 0 && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                <strong>{missingDocs} document(s)</strong> still pending/rejected verification.
                {' '}<button className="underline" onClick={() => setActiveTab('documents')}>Review now</button>
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6">
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-sm border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-brand-600 text-brand-700 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'overview'  && (
        <CustomerOverviewTab
          customer={c}
          onStatusChange={(status) => statusMutation.mutate(status)}
        />
      )}      {activeTab === 'documents' && <CustomerDocumentsTab customerId={id!} />}
      {activeTab === 'details'   && <CustomerAdditionalDetailsTab customerId={id!} existingValues={data.formData?.values ?? null} profile={data.profile as Customer360['profile']} />}
      {activeTab === 'loans'     && <CustomerLoansTab customerId={id!} />}
      {activeTab === 'timeline'  && <CustomerTimelineTab entries={data.timeline} />}
    </div>
  );
}

function CustomerOverviewTab({
  customer: c, onStatusChange,
}: { customer: Customer; onStatusChange: (s: CustomerStatus) => void }) {
  const { hasPermission } = useAuthStore();
  const navigate = useNavigate();

  // Loan officer can only flag as KYC_PENDING (hand off to compliance)
  const officerStatuses: CustomerStatus[] = ['KYC_PENDING'];
  // Compliance + admin can set all statuses
  const complianceStatuses: CustomerStatus[] = ['KYC_PENDING', 'KYC_VERIFIED', 'ELIGIBLE', 'INELIGIBLE', 'BLACKLISTED'];

  const isCompliance =
    hasPermission('loan_applications:compliance_review') ||
    hasPermission('customers:manage') ||
    hasPermission('system:admin');

  const availableStatuses = isCompliance ? complianceStatuses : officerStatuses;

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-800 font-medium mt-0.5">{value ?? '—'}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">Identity</h3>
        </div>
        <div className="card-body grid grid-cols-2 gap-4">
          <Field label="Type" value={c.type === 'BUSINESS' ? 'Business' : 'Individual'} />
          <Field label="Business Name" value={c.businessName} />
          <Field label="Gender" value={c.gender} />
          <Field label="Date of Birth" value={c.dateOfBirth ? formatDate(c.dateOfBirth) : null} />
          <Field label="Registered" value={formatDate(c.createdAt)} />
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">Address & Location</h3>
        </div>
        <div className="card-body grid grid-cols-1 gap-4">
          <Field label="Residential Address" value={c.residentialAddress} />
          <Field label="Business Address" value={c.businessAddress} />
          <Field label="GPS" value={c.gpsLat && c.gpsLng ? `${c.gpsLat}, ${c.gpsLng}` : null} />
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">Government IDs</h3>
        </div>
        <div className="card-body grid grid-cols-2 gap-4">
          <Field label="BVN" value={c.bvn} />
          <Field label="NIN" value={c.nin} />
          <Field label="Alternate Phone" value={c.alternatePhone} />
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">KYC & Eligibility Status</h3>
        </div>
        <div className="card-body">
          {isCompliance ? (
            <p className="text-xs text-gray-500 mb-3">
              As a Compliance Officer, you can advance this customer through full KYC verification.
            </p>
          ) : (
            <p className="text-xs text-gray-500 mb-3">
              Mark the customer as <strong>KYC Pending</strong> to notify Compliance to begin verification.
              Only Compliance Officers can mark Eligible/Ineligible.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {availableStatuses.map((status) => (
              <button
                key={status}
                disabled={c.status === status}
                onClick={() => onStatusChange(status)}
                className={`btn-sm ${c.status === status ? 'btn-primary' : 'btn-secondary'} disabled:opacity-50`}
              >
                {STATUS_BADGE[status]?.label ?? status}
              </button>
            ))}
          </div>
          {!isCompliance && c.status === 'KYC_PENDING' && (
            <p className="text-xs text-amber-600 mt-2">
              ✓ Marked for compliance review. Compliance Officer will verify and mark eligible.
            </p>
          )}
          {c.status === 'ELIGIBLE' && hasPermission('loan_applications:create') && (
            <button
              onClick={() => navigate(`/loans/new?customerId=${c.id}`)}
              className="btn-primary btn-sm gap-1.5 mt-3 w-full"
            >
              <Landmark className="w-3.5 h-3.5" /> Apply for Loan
            </button>
          )}
        </div>
      </div>

      <CustomerVirtualAccountsCard customerId={c.id} />
    </div>
  );
}

function CustomerVirtualAccountsCard({ customerId }: { customerId: string }) {
  const navigate = useNavigate();
  const { data: accounts } = useQuery({
    queryKey: ['virtual-accounts', 'by-customer', customerId],
    queryFn: () => virtualAccountsService.list(customerId),
  });

  if (!accounts?.length) return null;

  return (
    <div className="card lg:col-span-2">
      <div className="card-header flex items-center gap-2">
        <Wallet className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-700">Virtual Accounts</h3>
      </div>
      <div className="card-body space-y-2">
        {accounts.map((va) => (
          <button
            key={va.id}
            onClick={() => navigate(`/loans/${va.loan?.loanApplicationId}`)}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 text-left"
          >
            <div>
              <p className="text-sm font-mono font-semibold text-gray-800">{va.accountNumber}</p>
              <p className="text-xs text-gray-500">{va.bankName} · {va.loan?.loanNumber ?? 'Loan'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={va.provider === 'LOCAL' ? 'gray' : 'blue'}>{va.provider}</Badge>
              <Badge variant={va.status === 'ACTIVE' ? 'green' : 'gray'}>{va.status}</Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
