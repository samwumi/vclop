import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarClock, MessageSquare, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { collectionsService, type CollectionCase, type CollectionCaseStatus } from '@/services/collections.service';

const STATUS_OPTS: Array<{ value: CollectionCaseStatus; label: string }> = [
  { value: 'OPEN', label: 'Open' },
  { value: 'PROMISE_TO_PAY', label: 'Promise to Pay' },
  { value: 'BROKEN_PROMISE', label: 'Broken Promise' },
  { value: 'LEGAL', label: 'Legal Action' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'WRITTEN_OFF', label: 'Written Off' },
];

const STATUS_VARIANT: Record<CollectionCaseStatus, 'green' | 'red' | 'yellow' | 'blue' | 'gray'> = {
  OPEN: 'yellow',
  PROMISE_TO_PAY: 'blue',
  BROKEN_PROMISE: 'red',
  LEGAL: 'red',
  RESOLVED: 'green',
  WRITTEN_OFF: 'gray',
};

const ACTIVITY_TYPES = ['CALL', 'VISIT', 'SMS', 'EMAIL', 'PROMISE', 'LEGAL_NOTICE', 'OTHER'];

interface Props {
  collectionCase: CollectionCase;
  onClose: () => void;
}

export function CollectionCasePanel({ collectionCase: caseData, onClose }: Props) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'status' | 'activity'>('activity');

  // Status update form
  const [newStatus, setNewStatus] = useState<CollectionCaseStatus>(caseData.status);
  const [promiseAmount, setPromiseAmount] = useState(caseData.promiseAmount?.toString() ?? '');
  const [promiseDate, setPromiseDate] = useState(caseData.promiseDate?.split('T')[0] ?? '');
  const [nextActionAt, setNextActionAt] = useState(caseData.nextActionAt?.split('T')[0] ?? '');
  const [writeOffReason, setWriteOffReason] = useState(caseData.writeOffReason ?? '');

  // Activity form
  const [activityType, setActivityType] = useState('CALL');
  const [activityNote, setActivityNote] = useState('');
  const [activityNext, setActivityNext] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['collection-cases'] });

  const updateMutation = useMutation({
    mutationFn: () =>
      collectionsService.update(caseData.id, {
        status: newStatus !== caseData.status ? newStatus : undefined,
        nextActionAt: nextActionAt || undefined,
        promiseAmount: promiseAmount ? Number(promiseAmount) : undefined,
        promiseDate: promiseDate || undefined,
        writeOffReason: writeOffReason || undefined,
      }),
    onSuccess: () => { toast.success('Case updated'); invalidate(); onClose(); },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed'),
  });

  const activityMutation = useMutation({
    mutationFn: () =>
      collectionsService.addActivity(caseData.id, {
        activityType,
        note: activityNote,
        nextActionAt: activityNext || undefined,
      }),
    onSuccess: () => {
      toast.success('Activity logged');
      setActivityNote('');
      setActivityNext('');
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to log activity'),
  });

  const customer = caseData.loan?.loanApplication?.customer;
  const overdue = caseData.loan?.installments.filter(
    (i) => i.status === 'OVERDUE' || (i.status !== 'PAID' && new Date(i.dueDate) < new Date()),
  ) ?? [];
  const totalOverdue = overdue.reduce(
    (sum, i) => sum + (Number(i.totalDue) - Number(i.amountPaid)), 0,
  );
  const earliestDue = overdue.length
    ? overdue.reduce((a, b) => new Date(a.dueDate) < new Date(b.dueDate) ? a : b)
    : null;
  const dpd = earliestDue
    ? Math.max(0, Math.floor((Date.now() - new Date(earliestDue.dueDate).getTime()) / 86_400_000))
    : 0;

  return (
    <div className="panel-overlay">
      <div className="panel-backdrop" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col">

        {/* Header */}
        <div className="panel-header">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-800 font-mono">
              {caseData.loan?.loanNumber ?? 'Collection Case'}
            </h2>
            <button onClick={onClose} className="btn-ghost btn-icon w-8 h-8 text-gray-400 text-lg leading-none">✕</button>
          </div>
          {customer && (
            <p className="text-sm text-gray-600">
              {customer.firstName} {customer.lastName}
              <span className="text-gray-400 ml-1">· {customer.phone}</span>
            </p>
          )}
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-gray-500">
              Overdue: <strong className="text-red-600">₦{totalOverdue.toLocaleString()}</strong>
            </span>
            <span className="text-gray-500">
              DPD: <strong className="text-red-600">{dpd} days</strong>
            </span>
            <Badge variant={STATUS_VARIANT[caseData.status]}>{caseData.status.replace(/_/g, ' ')}</Badge>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['activity', 'status'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors capitalize ${activeTab === tab ? 'border-b-2 border-brand-600 text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab === 'activity' ? 'Log Activity' : 'Update Case'}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Log new activity */}
              <div className="space-y-3">
                <div>
                  <label className="form-label">Activity Type</label>
                  <select className="form-input" value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                    {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Note <span className="text-red-500">*</span></label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="What happened? What was discussed?"
                    value={activityNote}
                    onChange={(e) => setActivityNote(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Next Action Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={activityNext}
                    onChange={(e) => setActivityNext(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => activityMutation.mutate()}
                  disabled={!activityNote || activityMutation.isPending}
                  className="btn-primary w-full disabled:opacity-50 gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {activityMutation.isPending ? 'Logging…' : 'Log Activity'}
                </button>
              </div>

              {/* History */}
              {(caseData.activities?.length ?? 0) > 0 && (
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <p className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" /> Activity History
                  </p>
                  {caseData.activities?.map((act) => (
                    <div key={act.id} className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700 uppercase tracking-wide">{act.activityType}</span>
                        <span className="text-gray-400">{formatDateTime(act.occurredAt)}</span>
                      </div>
                      <p className="text-gray-600">{act.note}</p>
                      {act.nextActionAt && (
                        <p className="text-brand-600 flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" /> Follow up: {formatDate(act.nextActionAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-4">
              <div>
                <label className="form-label">Case Status</label>
                <select className="form-input" value={newStatus} onChange={(e) => setNewStatus(e.target.value as CollectionCaseStatus)}>
                  {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {(newStatus === 'PROMISE_TO_PAY') && (
                <>
                  <div>
                    <label className="form-label">Promise Amount (₦)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Amount promised"
                      value={promiseAmount}
                      onChange={(e) => setPromiseAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Promise Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={promiseDate}
                      onChange={(e) => setPromiseDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              {newStatus === 'WRITTEN_OFF' && (
                <div>
                  <label className="form-label">Write-off Reason <span className="text-red-500">*</span></label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Required — explain why this loan is being written off"
                    value={writeOffReason}
                    onChange={(e) => setWriteOffReason(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="form-label">Next Action Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={nextActionAt}
                  onChange={(e) => setNextActionAt(e.target.value)}
                />
              </div>

              {/* Repayment schedule summary */}
              {overdue.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-2">Overdue Installments</p>
                  <div className="space-y-1.5">
                    {overdue.map((inst) => (
                      <div key={inst.id} className="flex justify-between text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <CalendarClock className="w-3 h-3 text-red-400" /> {formatDate(inst.dueDate)}
                        </span>
                        <span className="font-medium text-red-600">
                          ₦{(Number(inst.totalDue) - Number(inst.amountPaid)).toLocaleString()} outstanding
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'status' && (
          <div className="panel-footer">
            <button
              onClick={() => updateMutation.mutate()}
              disabled={(newStatus === 'WRITTEN_OFF' && !writeOffReason) || updateMutation.isPending}
              className="btn-primary w-full disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
