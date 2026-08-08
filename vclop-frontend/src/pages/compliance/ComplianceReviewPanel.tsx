import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2, XCircle, RotateCcw, MapPin, Clock,
  ClipboardList, ShieldCheck, Navigation, FileText, Eye, User,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import {
  complianceService,
  type ComplianceAssessment,
  type WorkflowRecommendation,
} from '@/services/compliance.service';
import { workflowsService } from '@/services/workflows.service';
import { customersService } from '@/services/customers.service';
import type { ComplianceQueueItem } from '@/services/compliance.service';

const VISIT_TYPES = ['BUSINESS', 'RESIDENCE', 'EMPLOYER', 'GUARANTOR', 'OTHER'];
const RECOMMENDATION_OPTS: Array<{ value: WorkflowRecommendation; label: string; color: string }> = [
  { value: 'APPROVE',              label: 'Recommend Approve',  color: 'bg-emerald-600' },
  { value: 'REJECT',               label: 'Recommend Reject',   color: 'bg-red-600' },
  { value: 'RETURN',               label: 'Return to Officer',  color: 'bg-amber-500' },
  { value: 'REQUEST_INFORMATION',  label: 'Request More Info',  color: 'bg-blue-600' },
  { value: 'ESCALATE',             label: 'Escalate',           color: 'bg-violet-600' },
];

type Tab = 'documents' | 'customer' | 'assessment' | 'verification' | 'visits' | 'action';

interface Props {
  application: ComplianceQueueItem;
  onClose: () => void;
}

export function ComplianceReviewPanel({ application, onClose }: Props) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('documents');

  // ── Assessment form state ──────────────────────────────────────────────────
  const [form, setForm] = useState({
    bankStatementNotes: '',
    incomeAssessment: '',
    affordabilityScore: '',
    cashFlowAssessment: '',
    riskScore: '',
    recommendation: '' as WorkflowRecommendation | '',
    recommendationNotes: '',
  });

  // ── Field visit form state ─────────────────────────────────────────────────
  const [visitForm, setVisitForm] = useState({
    visitType: 'BUSINESS',
    latitude: '',
    longitude: '',
    arrivedAt: '',
    completedAt: '',
    findings: '',
    photos: [] as string[], // base64 photos
  });

  // ── Workflow action state ──────────────────────────────────────────────────
  const [wfAction, setWfAction] = useState<'APPROVE' | 'REJECT' | 'RETURN' | 'REQUEST_INFORMATION' | ''>('');
  const [wfReason, setWfReason] = useState('');
  const [wfNotes, setWfNotes] = useState('');

  const invalidateQueue = () => qc.invalidateQueries({ queryKey: ['compliance-queue'] });

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: assessment } = useQuery({
    queryKey: ['compliance-assessment', application.id],
    queryFn: () => complianceService.getAssessment(application.id),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['compliance-visits', application.id],
    queryFn: () => complianceService.getFieldVisits(application.id),
  });

  // Customer documents (loaded when panel opens)
  const { data: documents = [] } = useQuery({
    queryKey: ['compliance-customer-docs', application.customerId],
    queryFn: () => complianceService.getCustomerDocuments(application.customerId),
    enabled: !!application.customerId,
  });

  // Full customer 360 for the Customer Details tab
  const { data: customer360 } = useQuery({
    queryKey: ['customer360', application.customerId],
    queryFn: () => customersService.get(application.customerId),
    enabled: !!application.customerId,
  });

  // Seed form with existing assessment data when loaded
  useEffect(() => {
    if (!assessment) return;
    setForm({
      bankStatementNotes:  assessment.bankStatementNotes  ?? '',
      incomeAssessment:    assessment.incomeAssessment    ?? '',
      affordabilityScore:  assessment.affordabilityScore != null ? String(assessment.affordabilityScore) : '',
      cashFlowAssessment:  assessment.cashFlowAssessment  ?? '',
      riskScore:           assessment.riskScore != null ? String(assessment.riskScore) : '',
      recommendation:      (assessment.recommendation as WorkflowRecommendation) ?? '',
      recommendationNotes: assessment.recommendationNotes ?? '',
    });
  }, [assessment]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => complianceService.saveAssessment(application.id, {
      bankStatementNotes:  form.bankStatementNotes  || undefined,
      incomeAssessment:    form.incomeAssessment    || undefined,
      affordabilityScore:  form.affordabilityScore  ? Number(form.affordabilityScore)  : undefined,
      cashFlowAssessment:  form.cashFlowAssessment  || undefined,
      riskScore:           form.riskScore           ? Number(form.riskScore)           : undefined,
      recommendation:      (form.recommendation as WorkflowRecommendation) || undefined,
      recommendationNotes: form.recommendationNotes || undefined,
    }),
    onSuccess: () => {
      toast.success('Assessment saved');
      qc.invalidateQueries({ queryKey: ['compliance-assessment', application.id] });
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed'),
  });

  const visitMutation = useMutation({
    mutationFn: () => complianceService.addFieldVisit(application.id, {
      visitType:   visitForm.visitType,
      latitude:    visitForm.latitude   ? Number(visitForm.latitude)   : undefined,
      longitude:   visitForm.longitude  ? Number(visitForm.longitude)  : undefined,
      arrivedAt:   visitForm.arrivedAt   || undefined,
      completedAt: visitForm.completedAt || undefined,
      findings:    visitForm.findings    || undefined,
      photos:      visitForm.photos.length > 0 ? JSON.stringify(visitForm.photos) : undefined,
    }),
    onSuccess: () => {
      toast.success('Field visit logged');
      setVisitForm({ visitType: 'BUSINESS', latitude: '', longitude: '', arrivedAt: '', completedAt: '', findings: '', photos: [] });
      qc.invalidateQueries({ queryKey: ['compliance-visits', application.id] });
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to log visit'),
  });

  const workflowMutation = useMutation({
    mutationFn: () => workflowsService.transition('LOAN_APPLICATION', application.id, {
      action: wfAction as 'APPROVE' | 'REJECT' | 'RETURN' | 'REQUEST_INFORMATION',
      reason: wfReason || undefined,
      notes:  wfNotes  || undefined,
    }),
    onSuccess: () => {
      toast.success('Decision submitted — application moved to next stage');
      invalidateQueue();
      onClose();
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Workflow action failed'),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function VerifyRow({ label, verifiedAt, field }: {
    label: string;
    verifiedAt: string | null | undefined;
    field: keyof ComplianceAssessment;
  }) {
    const toggleMutation = useMutation({
      mutationFn: () => complianceService.saveAssessment(application.id, {
        [field]: verifiedAt ? null : new Date().toISOString(),
      } as Parameters<typeof complianceService.saveAssessment>[1]),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance-assessment', application.id] }),
    });
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
        <span className="text-sm text-gray-700">{label}</span>
        <button
          onClick={() => toggleMutation.mutate()}
          disabled={toggleMutation.isPending}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-colors ${verifiedAt ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          {verifiedAt ? <><CheckCircle2 className="w-3.5 h-3.5" /> Verified</> : 'Mark Verified'}
        </button>
      </div>
    );
  }

  const TABS: Array<{ id: Tab; label: string; icon: typeof ClipboardList }> = [
    { id: 'documents',    label: 'Documents',       icon: FileText },
    { id: 'customer',     label: 'Customer Details', icon: User },
    { id: 'assessment',   label: 'Assessment',      icon: ClipboardList },
    { id: 'verification', label: 'Verifications',   icon: ShieldCheck },
    { id: 'visits',       label: 'Field Visits',    icon: Navigation },
    { id: 'action',       label: 'Decision',        icon: CheckCircle2 },
  ];

  const customer = application.customer;

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
          <div className="flex gap-3 mt-2 text-xs text-gray-500">
            <span>₦{Number(application.amount).toLocaleString()}</span>
            <span>·</span>
            <span>{application.tenureDays} days</span>
            <span>·</span>
            <span>{application.loanProduct?.name ?? '—'}</span>
            <span>·</span>
            <Badge variant={application.status === 'COMPLIANCE_REVIEW' ? 'yellow' : application.status === 'AWAITING_INFORMATION' ? 'blue' : 'gray'}>
              {application.status.replace(/_/g, ' ')}
            </Badge>
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

        {/* Tab bodies */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── Documents ─────────────────────────────────────────────────── */}
          {tab === 'documents' && (
            <div className="space-y-4">
              {/* Customer profile details */}
              {application.customer && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 space-y-2">
                  <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Customer Profile</p>
                  <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                    <span className="text-blue-600">Customer #</span>
                    <span className="font-mono text-blue-900">{application.customer.customerNumber}</span>
                    <span className="text-blue-600">Phone</span>
                    <span className="text-blue-900">{application.customer.phone}</span>
                    {(application.customer as typeof application.customer & { bvn?: string }).bvn && (
                      <><span className="text-blue-600">BVN</span><span className="text-blue-900">{(application.customer as typeof application.customer & { bvn?: string }).bvn}</span></>
                    )}
                    {(application.customer as typeof application.customer & { nin?: string }).nin && (
                      <><span className="text-blue-600">NIN</span><span className="text-blue-900">{(application.customer as typeof application.customer & { nin?: string }).nin}</span></>
                    )}
                  </div>
                  <a
                    href={`/customers/${application.customerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-600 hover:underline"
                  >
                    Open Full Customer Profile →
                  </a>
                </div>
              )}

              {/* Loan details */}
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-1.5">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Loan Request</p>
                <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium text-gray-900">₦{Number(application.amount).toLocaleString()}</span>
                  <span className="text-gray-500">Tenure</span>
                  <span className="text-gray-900">{application.tenureDays} days</span>
                  <span className="text-gray-500">Product</span>
                  <span className="text-gray-900">{application.loanProduct?.name ?? '—'}</span>
                  {application.purpose && (
                    <><span className="text-gray-500">Purpose</span><span className="text-gray-900">{application.purpose}</span></>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Submitted Documents ({documents.length})
                </p>
                {documents.length === 0 ? (
                  <div className="py-6 text-center border border-dashed border-gray-200 rounded-lg">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-3 rounded-lg border border-gray-100 bg-white">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {doc.documentType?.name ?? 'Document'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {doc.originalName} · {doc.mimeType}
                                {doc.size ? ` · ${(doc.size / 1024).toFixed(0)} KB` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              doc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' :
                              doc.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {doc.status}
                            </span>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-brand-600 hover:underline font-medium"
                              title={`View ${doc.originalName}`}
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </a>
                          </div>
                        </div>
                        {doc.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1 pl-6">Rejected: {doc.rejectionReason}</p>
                        )}
                        {doc.verifiedAt && (
                          <p className="text-xs text-emerald-600 mt-1 pl-6">✓ Verified {formatDateTime(doc.verifiedAt)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Customer Details ──────────────────────────────────────────── */}
          {tab === 'customer' && (() => {
            // Use customer360 when available, fall back to application.customer for immediate data
            const c360 = customer360?.profile as Record<string, string | null | undefined> | undefined;
            const appCust = application.customer as (typeof application.customer & Record<string, string | null | undefined>) | undefined;
            // Merge: customer360 takes precedence for richer fields, appCust for immediate display
            const c: Record<string, string | null | undefined> = {
              ...appCust,
              ...c360,
            };
            const fd = customer360?.formData?.values as Record<string, string> | undefined;
            const Row = ({ label, value }: { label: string; value?: string | null }) => (
              <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0 gap-2">
                <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
                <span className="text-xs font-medium text-gray-800 text-right">{value || <span className="text-gray-400 italic">—</span>}</span>
              </div>
            );
            return (
              <div className="space-y-4">
                {/* Identity */}
                <div className="card p-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Identity</p>
                  <Row label="Full Name"    value={c ? `${c.firstName ?? ''} ${c.middleName ?? ''} ${c.lastName ?? ''}`.trim() : ''} />
                  <Row label="Customer No." value={c?.customerNumber} />
                  <Row label="Type"         value={c?.type} />
                  <Row label="Gender"       value={c?.gender} />
                  <Row label="Date of Birth" value={c?.dateOfBirth ? new Date(c.dateOfBirth).toLocaleDateString('en-NG') : ''} />
                  <Row label="Status"       value={c?.status} />
                </div>

                {/* Contact */}
                <div className="card p-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Contact & IDs</p>
                  <Row label="Phone"         value={c?.phone} />
                  <Row label="Alt. Phone"    value={c?.alternatePhone} />
                  <Row label="Email"         value={c?.email} />
                  <Row label="BVN"           value={c?.bvn} />
                  <Row label="NIN"           value={c?.nin} />
                </div>

                {/* Address */}
                <div className="card p-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Address</p>
                  <Row label="Residential" value={c?.residentialAddress} />
                  <Row label="Business"    value={c?.businessAddress} />
                </div>

                {/* Employment from form data */}
                {fd && (
                  <div className="card p-4">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Employment</p>
                    <Row label="Employer"         value={fd.employer_name} />
                    <Row label="Employment Type"  value={fd.employment_type} />
                    <Row label="Job Title"        value={fd.job_title} />
                    <Row label="Monthly Income"   value={fd.monthly_income ? `₦${Number(fd.monthly_income).toLocaleString('en-NG')}` : ''} />
                    <Row label="Employer Phone"   value={fd.employer_phone} />
                    <Row label="Employer Address" value={fd.employer_address} />
                  </div>
                )}

                {/* Next of Kin from form data */}
                {fd && (fd.nok_name || fd.nok_phone) && (
                  <div className="card p-4">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Next of Kin</p>
                    <Row label="Full Name"     value={fd.nok_name} />
                    <Row label="Relationship"  value={fd.nok_relationship} />
                    <Row label="Phone"         value={fd.nok_phone} />
                    <Row label="Address"       value={fd.nok_address} />
                  </div>
                )}

                <a
                  href={`/customers/${application.customerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-xs text-brand-600 hover:underline py-2"
                >
                  Open Full Customer Profile in new tab →
                </a>
              </div>
            );
          })()}

          {/* ── Assessment ────────────────────────────────────────────────── */}
          {tab === 'assessment' && (            <>
              <div>
                <label className="form-label">Bank Statement Notes</label>
                <textarea className="form-input" rows={3} placeholder="Summary of bank statement review — income patterns, outflows, salary credits…" value={form.bankStatementNotes} onChange={(e) => setForm(f => ({ ...f, bankStatementNotes: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Income Assessment</label>
                <textarea className="form-input" rows={3} placeholder="Monthly income, sources, stability, verifiability…" value={form.incomeAssessment} onChange={(e) => setForm(f => ({ ...f, incomeAssessment: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Affordability Score (0–100)</label>
                  <input type="number" min="0" max="100" className="form-input" placeholder="e.g. 72" value={form.affordabilityScore} onChange={(e) => setForm(f => ({ ...f, affordabilityScore: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Risk Score (0–100)</label>
                  <input type="number" min="0" max="100" className="form-input" placeholder="e.g. 35" value={form.riskScore} onChange={(e) => setForm(f => ({ ...f, riskScore: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Cash Flow Assessment</label>
                <textarea className="form-input" rows={2} placeholder="Net monthly cash flow, surplus after obligations…" value={form.cashFlowAssessment} onChange={(e) => setForm(f => ({ ...f, cashFlowAssessment: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Recommendation</label>
                <div className="flex flex-wrap gap-2">
                  {RECOMMENDATION_OPTS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, recommendation: opt.value }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.recommendation === opt.value ? `${opt.color} text-white border-transparent` : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Recommendation Notes <span className="text-gray-400">(required before submitting decision)</span></label>
                <textarea className="form-input" rows={3} placeholder="Explain your recommendation in detail…" value={form.recommendationNotes} onChange={(e) => setForm(f => ({ ...f, recommendationNotes: e.target.value }))} />
              </div>
            </>
          )}

          {/* ── Verifications ─────────────────────────────────────────────── */}
          {tab === 'verification' && (
            <div className="card p-4 space-y-0.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Identity & Background</p>
              <VerifyRow label="BVN Verified"        verifiedAt={assessment?.bvnVerifiedAt}        field="bvnVerifiedAt" />
              <VerifyRow label="NIN Verified"        verifiedAt={assessment?.ninVerifiedAt}        field="ninVerifiedAt" />
              <VerifyRow label="Phone Verified"      verifiedAt={assessment?.phoneVerifiedAt}      field="phoneVerifiedAt" />
              <VerifyRow label="Employer Verified"   verifiedAt={assessment?.employerVerifiedAt}   field="employerVerifiedAt" />
              <VerifyRow label="Business Verified"   verifiedAt={assessment?.businessVerifiedAt}   field="businessVerifiedAt" />
              <VerifyRow label="Residence Verified"  verifiedAt={assessment?.residenceVerifiedAt}  field="residenceVerifiedAt" />
            </div>
          )}

          {/* ── Field Visits ──────────────────────────────────────────────── */}
          {tab === 'visits' && (
            <>
              {/* Log new visit */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700">Log Field Visit</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Visit Type</label>
                    <select className="form-input" value={visitForm.visitType} onChange={(e) => setVisitForm(f => ({ ...f, visitType: e.target.value }))}>
                      {VISIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Arrived At</label>
                    <input type="datetime-local" className="form-input" value={visitForm.arrivedAt} onChange={(e) => setVisitForm(f => ({ ...f, arrivedAt: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Completed At</label>
                    <input type="datetime-local" className="form-input" value={visitForm.completedAt} onChange={(e) => setVisitForm(f => ({ ...f, completedAt: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Latitude (GPS)</label>
                    <input type="number" step="any" className="form-input" placeholder="e.g. 6.5244" value={visitForm.latitude} onChange={(e) => setVisitForm(f => ({ ...f, latitude: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Longitude (GPS)</label>
                    <input type="number" step="any" className="form-input" placeholder="e.g. 3.3792" value={visitForm.longitude} onChange={(e) => setVisitForm(f => ({ ...f, longitude: e.target.value }))} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      toast.error('Geolocation not supported on this device');
                      return;
                    }
                    toast.loading('Getting your location…', { id: 'gps' });
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setVisitForm(f => ({
                          ...f,
                          latitude: pos.coords.latitude.toFixed(6),
                          longitude: pos.coords.longitude.toFixed(6),
                        }));
                        toast.success(
                          `📍 GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
                          { id: 'gps' },
                        );
                      },
                      (err) => {
                        toast.error(
                          err.code === 1
                            ? 'Location access denied — please allow location in your browser settings'
                            : 'Could not get location — check browser permissions',
                          { id: 'gps' },
                        );
                      },
                      { enableHighAccuracy: true, timeout: 15000 },
                    );
                  }}
                  className="btn-primary btn-sm gap-1.5 w-full"
                >
                  <MapPin className="w-3.5 h-3.5" /> 📍 Capture My Current GPS Location
                </button>
                {visitForm.latitude && visitForm.longitude && (
                  <a
                    href={`https://maps.google.com/?q=${visitForm.latitude},${visitForm.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                    View on Google Maps: {visitForm.latitude}, {visitForm.longitude}
                  </a>
                )}
                <div>
                  <label className="form-label">Findings</label>
                  <textarea className="form-input" rows={3} placeholder="What did you observe? Business premises, stock, staff, residence…" value={visitForm.findings} onChange={(e) => setVisitForm(f => ({ ...f, findings: e.target.value }))} />
                </div>

                {/* Business Photo Upload */}
                <div>
                  <label className="form-label">Business Photos</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      className="hidden"
                      id="visit-photo-input"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const base64 = ev.target?.result as string;
                            setVisitForm(f => ({ ...f, photos: [...f.photos, base64] }));
                          };
                          reader.readAsDataURL(file);
                        });
                        e.target.value = '';
                      }}
                    />
                    <label
                      htmlFor="visit-photo-input"
                      className="btn-secondary btn-sm gap-1.5 w-full cursor-pointer flex items-center justify-center"
                    >
                      📷 Take / Upload Business Photo
                    </label>
                    {visitForm.photos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {visitForm.photos.map((photo, i) => (
                          <div key={i} className="relative">
                            <img src={photo} alt={`Visit photo ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                            <button
                              onClick={() => setVisitForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                            >×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => visitMutation.mutate()}
                  disabled={!visitForm.visitType || visitMutation.isPending}
                  className="btn-primary btn-sm gap-1.5 disabled:opacity-50"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {visitMutation.isPending ? 'Saving…' : 'Log Visit'}
                </button>
              </div>

              {/* Visit history */}
              {visits.length > 0 && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <p className="text-xs font-semibold text-gray-600">Visit History ({visits.length})</p>
                  {visits.map((v) => (
                    <div key={v.id} className="p-3 bg-gray-50 rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 uppercase tracking-wide">{v.visitType}</span>
                        <span className="text-gray-400">{formatDateTime(v.createdAt)}</span>
                      </div>
                      {v.arrivedAt && (
                        <p className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" /> {formatDateTime(v.arrivedAt)}
                          {v.completedAt && <> → {formatDateTime(v.completedAt)}</>}
                        </p>
                      )}
                      {(v.latitude && v.longitude) && (
                        <p className="flex items-center gap-1 text-brand-600">
                          <MapPin className="w-3 h-3" /> {Number(v.latitude).toFixed(6)}, {Number(v.longitude).toFixed(6)}
                        </p>
                      )}
                      {v.findings && <p className="text-gray-600">{v.findings}</p>}
                      {v.photos && (() => {
                        try {
                          const photos = JSON.parse(v.photos) as string[];
                          return photos.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {photos.map((src, i) => (
                                <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                                  <img src={src} alt={`Photo ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80" />
                                </a>
                              ))}
                            </div>
                          ) : null;
                        } catch { return null; }
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Decision / Workflow Action ────────────────────────────────── */}
          {tab === 'action' && (
            <div className="space-y-4">
              {assessment?.recommendation && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm">
                  <p className="font-medium text-blue-800">Saved recommendation: {assessment.recommendation.replace(/_/g, ' ')}</p>
                  {assessment.recommendationNotes && (
                    <p className="text-blue-600 mt-1 text-xs">{assessment.recommendationNotes}</p>
                  )}
                </div>
              )}

              <div>
                <label className="form-label">Submit Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { action: 'APPROVE',              label: 'Approve',          icon: CheckCircle2, cls: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' },
                    { action: 'REJECT',               label: 'Reject',           icon: XCircle,      cls: 'border-red-300 text-red-700 hover:bg-red-50' },
                    { action: 'RETURN',               label: 'Return to Officer', icon: RotateCcw,    cls: 'border-amber-300 text-amber-700 hover:bg-amber-50' },
                    { action: 'REQUEST_INFORMATION',  label: 'Request More Info', icon: ClipboardList,cls: 'border-blue-300 text-blue-700 hover:bg-blue-50' },
                  ] as const).map(({ action, label, icon: Icon, cls }) => (
                    <button
                      key={action}
                      onClick={() => setWfAction(action)}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${wfAction === action ? 'ring-2 ring-offset-1 ring-brand-500 ' + cls : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Icon className="w-4 h-4" />{label}
                    </button>
                  ))}
                </div>
              </div>

              {wfAction && (
                <>
                  <div>
                    <label className="form-label">
                      {wfAction === 'APPROVE' ? 'Notes (optional)' : 'Reason (required)'}
                    </label>
                    {wfAction !== 'APPROVE' ? (
                      <select
                        className="form-input"
                        value={wfReason}
                        onChange={(e) => setWfReason(e.target.value)}
                      >
                        <option value="">Select reason…</option>
                        {wfAction === 'REJECT' && <>
                          <option>Insufficient income to service loan</option>
                          <option>Customer failed BVN / NIN verification</option>
                          <option>Unverifiable business / employment</option>
                          <option>Negative credit history</option>
                          <option>Fraudulent or inconsistent documents</option>
                          <option>Customer is on blacklist / watchlist</option>
                          <option>Guarantor verification failed</option>
                          <option>Collateral value insufficient</option>
                          <option>Loan amount exceeds policy limit</option>
                          <option>Customer has existing overdue loan</option>
                          <option>Other — see notes below</option>
                        </>}
                        {wfAction === 'RETURN' && <>
                          <option>Missing or expired documents</option>
                          <option>Bank statement required</option>
                          <option>Additional guarantor required</option>
                          <option>Customer details need correction</option>
                          <option>Field visit not yet completed</option>
                          <option>Loan amount needs adjustment</option>
                          <option>Other — see notes below</option>
                        </>}
                        {wfAction === 'REQUEST_INFORMATION' && <>
                          <option>Bank statement (last 6 months)</option>
                          <option>Proof of income / payslip</option>
                          <option>Business registration document</option>
                          <option>Utility bill for address verification</option>
                          <option>Updated passport photograph</option>
                          <option>Guarantor identification documents</option>
                          <option>Other — see notes below</option>
                        </>}
                      </select>
                    ) : (
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="Any notes for the next stage…"
                        value={wfReason}
                        onChange={(e) => setWfReason(e.target.value)}
                      />
                    )}
                  </div>
                  <div>
                    <label className="form-label">Additional Notes</label>
                    <textarea className="form-input" rows={2} placeholder="Internal notes (visible to next reviewer)…" value={wfNotes} onChange={(e) => setWfNotes(e.target.value)} />
                  </div>
                </>
              )}
            </div>
          )}

        </div>{/* end scroll area */}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          {tab === 'assessment' && (
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Assessment'}
            </button>
          )}
          {tab === 'action' && (
            <button
              onClick={() => workflowMutation.mutate()}
              disabled={
                !wfAction ||
                (wfAction !== 'APPROVE' && !wfReason.trim()) ||
                workflowMutation.isPending
              }
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {workflowMutation.isPending ? 'Submitting…' : 'Submit Decision'}
            </button>
          )}
          <button onClick={onClose} className="btn-ghost px-4">Close</button>
        </div>

      </div>
    </div>
  );
}
