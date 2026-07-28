import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Car } from 'lucide-react';
import { toast } from 'sonner';
import { ModulePage } from '@/components/ui/ModulePage';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { complianceService, type ComplianceQueueItem } from '@/services/compliance.service';
import { transportService } from '@/services/transport.service';
import { ComplianceReviewPanel } from './ComplianceReviewPanel';
import { useAuthStore } from '@/stores/auth.store';
import type { LoanApplicationStatus } from '@/types/domain.types';

// All statuses that compliance officers work on
const COMPLIANCE_STATUSES: LoanApplicationStatus[] = [
  'SUBMITTED',
  'COMPLIANCE_REVIEW',
  'AWAITING_INFORMATION',
];

const STATUS_VARIANT: Record<string, 'green' | 'red' | 'yellow' | 'blue' | 'gray'> = {
  SUBMITTED:             'yellow',
  COMPLIANCE_REVIEW:     'yellow',
  AWAITING_INFORMATION:  'blue',
};

type StatusTab = LoanApplicationStatus | 'ALL';

export function CompliancePage() {
  const [search, setSearch]         = useState('');
  const [activeTab, setActiveTab]   = useState<StatusTab>('ALL');
  const [reviewing, setReviewing]   = useState<ComplianceQueueItem | null>(null);
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: all = [], isLoading, refetch } = useQuery({
    queryKey: ['compliance-queue'],
    queryFn:  complianceService.queue,
    refetchInterval: 30_000,          // poll every 30 s
    refetchOnWindowFocus: true,        // refresh when tab gets focus
    staleTime: 0,                      // always re-fetch on navigation
  });

  // Transport request button: enabled when 3+ pending applications exist
  // (the backend already scoped the queue to this officer's location)
  const pendingCount = all.filter(a => a.status === 'SUBMITTED' || a.status === 'COMPLIANCE_REVIEW').length;
  const canRequestTransport = pendingCount >= 3;

  const transportMutation = useMutation({
    mutationFn: () => {
      // Use the first pending application as the reference
      const ref = all.find(a => a.status === 'SUBMITTED' || a.status === 'COMPLIANCE_REVIEW');
      return transportService.create({
        loanApplicationId: ref!.id,
        purpose: `Field verification visit — ${pendingCount} pending application${pendingCount !== 1 ? 's' : ''} in queue`,
        location: user?.branchName ?? 'Field location',
      });
    },
    onSuccess: () => {
      toast.success('Transport request submitted for approval');
      qc.invalidateQueries({ queryKey: ['transport-requests'] });
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to submit transport request'),
  });

  // Count per status for tab badges
  const counts = COMPLIANCE_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = all.filter((a) => a.status === s).length;
    return acc;
  }, {});

  // Filter by tab + search
  const filtered = all.filter((a) => {
    const matchTab = activeTab === 'ALL' || a.status === activeTab;
    if (!matchTab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const name = a.customer ? `${a.customer.firstName} ${a.customer.lastName}`.toLowerCase() : '';
    return (
      a.applicationNumber.toLowerCase().includes(q) ||
      name.includes(q) ||
      (a.customer?.customerNumber?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <>
      {reviewing && (
        <ComplianceReviewPanel
          application={reviewing}
          onClose={() => {
            setReviewing(null);
            refetch(); // immediately refresh queue after any decision
          }}
        />
      )}

      <ModulePage
        title="Compliance Review"
        subtitle="Applications awaiting underwriting and compliance assessment"
        icon={ShieldCheck}
        search={search}
        onSearchChange={setSearch}
        actions={[
          {
            label: canRequestTransport
              ? `Request Transport (${pendingCount} pending)`
              : `Transport (need 3+ pending, have ${pendingCount})`,
            icon: Car,
            onClick: () => transportMutation.mutate(),
            variant: 'secondary',
            permission: canRequestTransport && !transportMutation.isPending,
          },
        ]}
        columns={[
          { key: 'appNo',     label: 'Application #' },
          { key: 'customer',  label: 'Customer' },
          { key: 'product',   label: 'Product',  width: '160px' },
          { key: 'amount',    label: 'Amount',   width: '130px' },
          { key: 'status',    label: 'Status',   width: '170px' },
          { key: 'submitted', label: 'Submitted', width: '110px' },
          { key: 'action',    label: '',          width: '100px' },
        ]}
        isLoading={isLoading}
        isEmpty={!isLoading && filtered.length === 0}
        emptyIcon={ShieldCheck}
        emptyTitle={activeTab === 'ALL' ? 'Queue is clear' : `No ${activeTab.replace(/_/g, ' ').toLowerCase()} applications`}
        emptyDescription="Applications submitted by loan officers will appear here automatically."
        filters={
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {/* All tab */}
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${activeTab === 'ALL' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All
              <span className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold ${activeTab === 'ALL' ? 'bg-brand-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {all.length}
              </span>
            </button>
            {COMPLIANCE_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setActiveTab(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === s ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {s === 'SUBMITTED' ? 'Submitted' : s === 'COMPLIANCE_REVIEW' ? 'In Review' : 'Awaiting Info'}
                {counts[s] > 0 && (
                  <span className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold ${activeTab === s ? 'bg-brand-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    {counts[s]}
                  </span>
                )}
              </button>
            ))}
          </div>
        }
        rows={
          <>
            {filtered.map((item: ComplianceQueueItem) => (
              <tr key={item.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setReviewing(item)}>
                <td className="font-mono text-xs font-semibold text-brand-600">{item.applicationNumber}</td>
                <td>
                  <p className="text-sm font-medium text-gray-800">
                    {item.customer ? `${item.customer.firstName} ${item.customer.lastName}` : '—'}
                  </p>
                  <p className="text-xs text-gray-400">{item.customer?.customerNumber ?? ''}</p>
                </td>
                <td className="text-xs text-gray-600">{item.loanProduct?.name ?? '—'}</td>
                <td className="text-sm font-medium">₦{Number(item.amount).toLocaleString()}</td>
                <td>
                  <Badge variant={STATUS_VARIANT[item.status] ?? 'gray'}>
                    {item.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="text-xs text-gray-500">{formatDate(item.submittedAt ?? item.createdAt)}</td>
                <td>
                  <button
                    onClick={(e) => { e.stopPropagation(); setReviewing(item); }}
                    className="btn-primary btn-sm"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </>
        }
      />
    </>
  );
}
