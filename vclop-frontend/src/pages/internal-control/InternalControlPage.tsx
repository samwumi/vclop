import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, CheckCircle2, XCircle, RotateCcw,
  Eye, FileText, ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModulePage } from '@/components/ui/ModulePage';
import { formatDate, formatDateTime } from '@/lib/utils';
import { api } from '@/lib/axios';
import { workflowsService, type WorkflowAction } from '@/services/workflows.service';
import { complianceService } from '@/services/compliance.service';
import type { ApiResponse } from '@/types/api.types';
import type { LoanApplication } from '@/types/domain.types';

type ReviewTab = 'documents' | 'details' | 'assessment' | 'decision';

// ── Review panel ──────────────────────────────────────────────────────────────

function ReviewPanel({ application, onClose }: { application: LoanApplication; onClose: () => void }) {
  const [tab, setTab] = useState<ReviewTab>('documents');
  const [action, setAction] = useState<WorkflowAction | null>(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: assessment } = useQuery({
    queryKey: ['ic-assessment', application.id],
    queryFn: () => complianceService.getAssessment(application.id),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['ic-docs', application.customerId],
    queryFn: () => complianceService.getCustomerDocuments(application.customerId),
    enabled: !!application.customerId,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['ic-visits', application.id],
    queryFn: () => complianceService.getFieldVisits(application.id),
  });

  const mutation = useMutation({
    mutationFn: () => workflowsService.transition('LOAN_APPLICATION', application.id, {
      action: action!,
      reason: reason || undefined,
      notes: notes || undefined,
    }),
    onSuccess: () => {
      toast.success(
        action === 'APPROVE' ? 'Approved — sent to Accounting Head for disbursement'
        : action === 'REJECT' ? 'Application rejected'
        : 'Returned to Compliance',
      );
      qc.invalidateQueries({ queryKey: ['ic-queue'] });
      onClose();
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Action failed'),
  });

  const customer = application.customer;
  const TABS: Array<{ id: ReviewTab; label: string; icon: typeof FileText }> = [
    { id: 'documents',  label: 'Documents',         icon: FileText },
    { id: 'details',    label: 'Application',        icon: ClipboardList },
    { id: 'assessment', label: 'Compliance Report',  icon: ShieldAlert },
    { id: 'decision',   label: 'Decision',           icon: CheckCircle2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-white h-full shadow-2xl flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 font-mono">{application.applicationNumber}</h2>
              {customer && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {customer.firstName} {customer.lastName}
                  <span className="text-gray-400 ml-1">· {customer.phone}</span>
                </p>
              )}
            </div>
            <button onClick={onClose} className="btn-ghost btn-icon w-8 h-8 text-gray-400 text-lg">✕</button>
          </div>
          <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
            <span>₦{Number(application.amount).toLocaleString()}</span>
            <span>·</span>
            <span>{application.tenureDays} days</span>
            <span>·</span>
            <span>{application.loanProduct?.name ?? '—'}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${tab === id ? 'border-b-2 border-brand-600 text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── Documents ─────────────────────────────────────────────── */}
          {tab === 'documents' && (
            <div className="space-y-3">
              {/* Customer profile */}
              {customer && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 space-y-1.5 text-xs">
                  <p className="font-semibold text-blue-800 uppercase tracking-wide">Customer</p>
                  <div className="grid grid-cols-2 gap-y-1">
                    <span className="text-blue-600">Number</span><span className="text-blue-900 font-mono">{customer.customerNumber}</span>
                    <span className="text-blue-600">Phone</span><span className="text-blue-900">{customer.phone}</span>
                    {(customer as typeof customer & { bvn?: string }).bvn && <><span className="text-blue-600">BVN</span><span className="text-blue-900">{(customer as typeof customer & { bvn?: string }).bvn}</span></>}
                    {(customer as typeof customer & { nin?: string }).nin && <><span className="text-blue-600">NIN</span><span className="text-blue-900">{(customer as typeof customer & { nin?: string }).nin}</span></>}
                  </div>
                  <a href={`/customers/${application.customerId}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                    Open Customer Profile →
                  </a>
                </div>
              )}

              {/* Documents */}
              <p className="text-xs font-semibold text-gray-700">Submitted Documents ({documents.length})</p>
              {documents.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-gray-200 rounded-lg">
                  <FileText className="w-7 h-7 text-gray-300 mx-auto mb-1" />
                  <p className="text-sm text-gray-400">No documents uploaded.</p>
                </div>
              ) : documents.map((doc) => (
                <div key={doc.id} className="p-3 rounded-lg border border-gray-100 bg-white flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.documentType?.name ?? 'Document'}</p>
                    <p className="text-xs text-gray-400">{doc.originalName} · {(doc.size / 1024).toFixed(0)} KB</p>
                    {doc.verifiedAt && <p className="text-xs text-emerald-600">✓ Verified {formatDateTime(doc.verifiedAt)}</p>}
                    {doc.rejectionReason && <p className="text-xs text-red-600">✗ {doc.rejectionReason}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${doc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : doc.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                      {doc.status}
                    </span>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-600 hover:underline font-medium">
                      <Eye className="w-3.5 h-3.5" /> View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Application Details ────────────────────────────────────── */}
          {tab === 'details' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                <p className="font-semibold text-gray-700 mb-2">Loan Request</p>
                <div className="grid grid-cols-2 gap-y-1.5 text-gray-600">
                  <span className="text-gray-400">Product</span><span className="font-medium">{application.loanProduct?.name ?? '—'}</span>
                  <span className="text-gray-400">Amount</span><span className="font-medium">₦{Number(application.amount).toLocaleString()}</span>
                  <span className="text-gray-400">Tenure</span><span>{application.tenureDays} days</span>
                  <span className="text-gray-400">Purpose</span><span>{application.purpose ?? '—'}</span>
                  <span className="text-gray-400">Submitted</span><span>{formatDate(application.submittedAt ?? application.createdAt)}</span>
                </div>
              </div>

              {/* Guarantors */}
              {(application.guarantors?.length ?? 0) > 0 && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                  <p className="font-semibold text-gray-700 mb-2">Guarantors ({application.guarantors!.length})</p>
                  {application.guarantors!.map((g) => (
                    <div key={g.id} className="mb-1.5">
                      <p className="font-medium text-gray-800">{g.firstName} {g.lastName}</p>
                      <p className="text-gray-500">{g.phone} {g.relationship ? `· ${g.relationship}` : ''}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Collateral */}
              {(application.collaterals?.length ?? 0) > 0 && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                  <p className="font-semibold text-gray-700 mb-2">Collateral ({application.collaterals!.length})</p>
                  {application.collaterals!.map((c) => (
                    <div key={c.id} className="mb-1.5">
                      <p className="font-medium text-gray-800">{c.description}</p>
                      {c.estimatedValue && <p className="text-gray-500">Est. ₦{Number(c.estimatedValue).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => navigate(`/loans/${application.id}`)} className="btn-secondary btn-sm gap-1.5 w-full">
                <Eye className="w-3.5 h-3.5" /> View Full Loan Detail
              </button>
            </div>
          )}

          {/* ── Compliance Assessment ──────────────────────────────────── */}
          {tab === 'assessment' && (
            <div className="space-y-3">
              {!assessment ? (
                <div className="py-6 text-center border border-dashed border-gray-200 rounded-lg">
                  <ShieldAlert className="w-7 h-7 text-gray-300 mx-auto mb-1" />
                  <p className="text-sm text-gray-400">No compliance assessment recorded yet.</p>
                </div>
              ) : (
                <>
                  {assessment.recommendation && (
                    <div className={`p-3 rounded-lg border text-sm font-medium ${
                      assessment.recommendation === 'APPROVE' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                      assessment.recommendation === 'REJECT'  ? 'bg-red-50 border-red-200 text-red-800' :
                      'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      Compliance Recommendation: {assessment.recommendation.replace(/_/g, ' ')}
                    </div>
                  )}
                  {assessment.recommendationNotes && (
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-700">
                      <p className="font-semibold text-gray-600 mb-1">Recommendation Notes</p>
                      {assessment.recommendationNotes}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {assessment.affordabilityScore != null && (
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <p className="text-gray-400 mb-0.5">Affordability Score</p>
                        <p className="text-xl font-bold text-gray-900">{assessment.affordabilityScore}</p>
                      </div>
                    )}
                    {assessment.riskScore != null && (
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <p className="text-gray-400 mb-0.5">Risk Score</p>
                        <p className={`text-xl font-bold ${Number(assessment.riskScore) > 60 ? 'text-red-600' : Number(assessment.riskScore) > 35 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {assessment.riskScore}
                        </p>
                      </div>
                    )}
                  </div>
                  {assessment.bankStatementNotes && (
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                      <p className="font-semibold text-gray-600 mb-1">Bank Statement Notes</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{assessment.bankStatementNotes}</p>
                    </div>
                  )}
                  {assessment.incomeAssessment && (
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                      <p className="font-semibold text-gray-600 mb-1">Income Assessment</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{assessment.incomeAssessment}</p>
                    </div>
                  )}
                  {/* Verifications */}
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                    <p className="font-semibold text-gray-600 mb-2">Verification Checklist</p>
                    {[
                      { label: 'BVN',        v: assessment.bvnVerifiedAt },
                      { label: 'NIN',        v: assessment.ninVerifiedAt },
                      { label: 'Phone',      v: assessment.phoneVerifiedAt },
                      { label: 'Employer',   v: assessment.employerVerifiedAt },
                      { label: 'Business',   v: assessment.businessVerifiedAt },
                      { label: 'Residence',  v: assessment.residenceVerifiedAt },
                    ].map(({ label, v }) => (
                      <div key={label} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                        <span className="text-gray-600">{label}</span>
                        {v ? (
                          <span className="text-emerald-600 font-medium">✓ Verified {formatDate(v)}</span>
                        ) : (
                          <span className="text-gray-400">Not verified</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Field visits */}
                  {visits.length > 0 && (
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                      <p className="font-semibold text-gray-600 mb-2">Field Visits ({visits.length})</p>
                      {visits.map((v) => (
                        <div key={v.id} className="mb-2 pb-2 border-b border-gray-100 last:border-0">
                          <p className="font-medium text-gray-700 uppercase">{v.visitType}</p>
                          {v.arrivedAt && <p className="text-gray-500">{formatDateTime(v.arrivedAt)}</p>}
                          {v.latitude && v.longitude && (
                            <a href={`https://maps.google.com/?q=${v.latitude},${v.longitude}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                              📍 {Number(v.latitude).toFixed(4)}, {Number(v.longitude).toFixed(4)}
                            </a>
                          )}
                          {v.findings && <p className="text-gray-600 mt-0.5">{v.findings}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Decision ───────────────────────────────────────────────── */}
          {tab === 'decision' && (
            <div className="space-y-4">
              <div>
                <label className="form-label">Decision</label>
                <div className="space-y-2">
                  {([
                    { value: 'APPROVE' as WorkflowAction, label: 'Approve — Send to Accounting', icon: CheckCircle2, cls: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' },
                    { value: 'REJECT'  as WorkflowAction, label: 'Reject Application',           icon: XCircle,      cls: 'border-red-300 text-red-700 hover:bg-red-50' },
                    { value: 'RETURN'  as WorkflowAction, label: 'Return to Compliance',         icon: RotateCcw,    cls: 'border-amber-300 text-amber-700 hover:bg-amber-50' },
                  ]).map(({ value, label, icon: Icon, cls }) => (
                    <button key={value} onClick={() => setAction(value)}
                      className={`w-full flex items-center gap-2.5 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${action === value ? `ring-2 ring-offset-1 ring-brand-500 ${cls}` : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />{label}
                    </button>
                  ))}
                </div>
              </div>
              {action && (
                <>
                  <div>
                    <label className="form-label">{action === 'APPROVE' ? 'Notes (optional)' : 'Reason (required)'}</label>
                    {action !== 'APPROVE' ? (
                      <select className="form-input" value={reason} onChange={(e) => setReason(e.target.value)}>
                        <option value="">Select reason…</option>
                        {action === 'REJECT' && <>
                          <option>Policy violation — loan exceeds approved limit</option>
                          <option>Compliance assessment incomplete</option>
                          <option>Fraud indicators detected</option>
                          <option>Customer exposure limit exceeded</option>
                          <option>Regulatory requirement not met</option>
                          <option>Other — see notes below</option>
                        </>}
                        {action === 'RETURN' && <>
                          <option>Compliance assessment requires more detail</option>
                          <option>Field visit report incomplete</option>
                          <option>Risk score not adequately justified</option>
                          <option>Missing compliance officer recommendation</option>
                          <option>Other — see notes below</option>
                        </>}
                      </select>
                    ) : (
                      <textarea className="form-input" rows={2} placeholder="Notes for the Accounting team…" value={reason} onChange={(e) => setReason(e.target.value)} />
                    )}
                  </div>
                  <div>
                    <label className="form-label">Additional Notes</label>
                    <textarea className="form-input" rows={2} placeholder="Internal notes (visible in workflow history)…" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          {tab === 'decision' && (
            <button
              onClick={() => mutation.mutate()}
              disabled={!action || (action !== 'APPROVE' && !reason.trim()) || mutation.isPending}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {mutation.isPending ? 'Submitting…' : 'Submit Decision'}
            </button>
          )}
          {tab !== 'decision' && (
            <button onClick={() => setTab('decision')} className="btn-primary flex-1 gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Go to Decision →
            </button>
          )}
          <button onClick={onClose} className="btn-ghost px-4">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function InternalControlPage() {
  const [search, setSearch] = useState('');
  const [reviewing, setReviewing] = useState<LoanApplication | null>(null);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['ic-queue', search],
    queryFn: async () => {
      const p = new URLSearchParams({ status: 'INTERNAL_CONTROL_REVIEW', limit: '100' });
      if (search) p.set('search', search);
      const res = await api.get<ApiResponse<LoanApplication[]>>(`/loan-applications?${p}`);
      return (res.data.data ?? []) as LoanApplication[];
    },
    refetchInterval: 60_000,
  });

  const applications = data ?? [];

  return (
    <>
      {reviewing && (
        <ReviewPanel application={reviewing} onClose={() => setReviewing(null)} />
      )}

      <ModulePage
        title="Internal Control"
        subtitle="Review compliance reports and submitted documents before approving for disbursement"
        icon={ShieldAlert}
        search={search}
        onSearchChange={setSearch}
        columns={[
          { key: 'ref',       label: 'Application #' },
          { key: 'customer',  label: 'Customer' },
          { key: 'product',   label: 'Product',   width: '160px' },
          { key: 'amount',    label: 'Amount',    width: '130px' },
          { key: 'submitted', label: 'Submitted', width: '110px' },
          { key: 'action',    label: '',          width: '180px' },
        ]}
        isLoading={isLoading}
        isEmpty={!isLoading && applications.length === 0}
        emptyIcon={ShieldAlert}
        emptyTitle="Queue is clear"
        emptyDescription="Applications approved by Compliance will appear here automatically."
        rows={
          <>
            {applications.map((app) => (
              <tr key={app.id}>
                <td className="font-mono text-xs font-semibold text-brand-600">{app.applicationNumber}</td>
                <td>
                  <p className="text-sm font-medium text-gray-800">{app.customer ? `${app.customer.firstName} ${app.customer.lastName}` : '—'}</p>
                  <p className="text-xs text-gray-400">{app.customer?.customerNumber ?? ''}</p>
                </td>
                <td className="text-xs text-gray-600">{app.loanProduct?.name ?? '—'}</td>
                <td className="text-sm font-medium">₦{Number(app.amount).toLocaleString()}</td>
                <td className="text-xs text-gray-500">{formatDate(app.submittedAt ?? app.createdAt)}</td>
                <td className="flex gap-1.5 py-2">
                  <button onClick={() => navigate(`/loans/${app.id}`)} className="btn-secondary btn-sm gap-1">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => setReviewing(app)} className="btn-primary btn-sm gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Review
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
