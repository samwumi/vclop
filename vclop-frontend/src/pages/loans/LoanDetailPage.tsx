import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Send, Banknote, UserPlus, Landmark, Wallet, Zap, Copy, Receipt, Car } from 'lucide-react';
import { loansService } from '@/services/loans.service';
import { virtualAccountsService } from '@/services/virtual-accounts.service';
import { receiptsService } from '@/services/receipts.service';
import { workflowsService, type WorkflowAction } from '@/services/workflows.service';
import { transportService } from '@/services/transport.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { LoanApplicationStatus } from '@/types/domain.types';

const STATUS_VARIANT: Record<LoanApplicationStatus, 'green' | 'red' | 'yellow' | 'blue' | 'gray'> = {
  DRAFT: 'gray', SUBMITTED: 'yellow', COMPLIANCE_REVIEW: 'yellow', AWAITING_INFORMATION: 'yellow', INTERNAL_CONTROL_REVIEW: 'yellow', ACCOUNTING_REVIEW: 'blue', APPROVED: 'blue', REJECTED: 'red', RETURNED: 'yellow', ESCALATED: 'red', DISBURSED: 'green', CANCELLED: 'gray',
};

export function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuthStore();
  const qc = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [guarantorForm, setGuarantorForm] = useState({ firstName: '', lastName: '', phone: '', relationship: '' });
  const [collateralForm, setCollateralForm] = useState({ description: '', estimatedValue: '' });
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [simulateAmount, setSimulateAmount] = useState('');
  const [transportForm, setTransportForm] = useState({
    purpose: '', location: '', customerCount: '', distanceKm: '', estimatedCost: '', suggestedAmount: '',
  });
  const [showTransportForm, setShowTransportForm] = useState(false);

  const { data: application, isLoading } = useQuery({
    queryKey: ['loan-application', id],
    queryFn: () => loansService.get(id!),
    enabled: !!id,
  });

  const { data: virtualAccount } = useQuery({
    queryKey: ['virtual-account', 'loan', application?.loan?.id],
    queryFn: () => virtualAccountsService.getByLoanId(application!.loan!.id),
    enabled: !!application?.loan,
    retry: false, // a 404 here just means the account hasn't been auto-created yet — not an error to retry
  });

  const simulatePaymentMutation = useMutation({
    mutationFn: () => virtualAccountsService.simulatePayment(virtualAccount!.id, { amount: Number(simulateAmount) }),
    onSuccess: () => {
      toast.success('Payment simulated and reconciled');
      setSimulateAmount('');
      qc.invalidateQueries({ queryKey: ['loan-application', id] });
      qc.invalidateQueries({ queryKey: ['virtual-account', 'loan', application?.loan?.id] });
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Simulation failed — only works while the LOCAL provider is active'),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['loan-application', id] });

  const addGuarantorMutation = useMutation({
    mutationFn: () => loansService.addGuarantor(id!, guarantorForm),
    onSuccess: () => { toast.success('Guarantor added'); setGuarantorForm({ firstName: '', lastName: '', phone: '', relationship: '' }); invalidate(); },
    onError: () => toast.error('Failed to add guarantor'),
  });

  const addCollateralMutation = useMutation({
    mutationFn: () => loansService.addCollateral(id!, { description: collateralForm.description, estimatedValue: collateralForm.estimatedValue ? Number(collateralForm.estimatedValue) : undefined }),
    onSuccess: () => { toast.success('Collateral added'); setCollateralForm({ description: '', estimatedValue: '' }); invalidate(); },
    onError: () => toast.error('Failed to add collateral'),
  });

  const submitMutation = useMutation({
    mutationFn: () => loansService.submit(id!),
    onSuccess: () => { toast.success('Application submitted for review'); invalidate(); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to submit'),
  });

  const reviewMutation = useMutation({
    mutationFn: (decision: 'APPROVED' | 'REJECTED') => loansService.review(id!, decision, reviewNotes || undefined, decision === 'REJECTED' ? rejectReason : undefined),
    onSuccess: (_, decision) => { toast.success(decision === 'APPROVED' ? 'Application approved' : 'Application rejected'); setShowReject(false); invalidate(); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Review failed'),
  });

  const workflowMutation = useMutation({
    mutationFn: (action: WorkflowAction) => workflowsService.transition('LOAN_APPLICATION', id!, { action, reason: action === 'REJECT' ? rejectReason : undefined, notes: reviewNotes || undefined }),
    onSuccess: () => { toast.success('Workflow decision recorded'); setShowReject(false); invalidate(); qc.invalidateQueries({ queryKey: ['workflow', 'loan-application', id] }); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Workflow action failed'),
  });

  const disburseMutation = useMutation({
    mutationFn: () => loansService.disburse(id!),
    onSuccess: () => { toast.success('Loan disbursed — repayment schedule generated'); invalidate(); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Disbursement failed'),
  });

  const repaymentMutation = useMutation({
    mutationFn: () => loansService.recordRepayment(application!.loan!.id, { amount: Number(repaymentAmount) }),
    onSuccess: () => { toast.success('Repayment recorded'); setRepaymentAmount(''); invalidate(); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to record repayment'),
  });

  const transportMutation = useMutation({
    mutationFn: () => transportService.create({
      loanApplicationId: id!,
      purpose: transportForm.purpose,
      location: transportForm.location,
      ...(transportForm.customerCount && { customerCount: Number(transportForm.customerCount) }),
      ...(transportForm.distanceKm && { distanceKm: Number(transportForm.distanceKm) }),
      ...(transportForm.estimatedCost && { estimatedCost: Number(transportForm.estimatedCost) }),
      ...(transportForm.suggestedAmount && { suggestedAmount: Number(transportForm.suggestedAmount) }),
    }),
    onSuccess: () => {
      toast.success('Transport request submitted');
      setTransportForm({ purpose: '', location: '', customerCount: '', distanceKm: '', estimatedCost: '', suggestedAmount: '' });
      setShowTransportForm(false);
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to submit transport request'),
  });

  if (isLoading) return <PageLoader />;
  if (!application) return null;

  const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-800 font-medium mt-0.5">{value ?? '—'}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Breadcrumbs />

      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900 font-mono">{application.applicationNumber}</h1>
              <p className="text-sm text-gray-500">
                {application.customer?.firstName} {application.customer?.lastName} · {application.loanProduct?.name}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[application.status]}>{application.status}</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <Field label="Amount" value={`₦${Number(application.amount).toLocaleString()}`} />
            <Field label="Tenure" value={`${application.tenureDays} days`} />
            <Field label="Purpose" value={application.purpose} />
            <Field label="Applied" value={formatDate(application.createdAt)} />
          </div>

          {application.rejectionReason && (
            <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              <strong>Rejected:</strong> {application.rejectionReason}
            </div>
          )}
        </div>

        {/* Action bar based on status */}
        <div className="border-t border-gray-100 px-6 py-3 flex flex-wrap gap-2">
          {application.status === 'DRAFT' && hasPermission('loan_applications:submit') && (
            <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} className="btn-primary btn-sm gap-1.5">
              <Send className="w-3.5 h-3.5" /> Submit for Review
            </button>
          )}
          {application.status === 'COMPLIANCE_REVIEW' && hasPermission('loan_applications:compliance_review') && !showReject && (
            <div className="w-full space-y-2">
              <input
                className="form-input text-xs h-8 max-w-sm"
                placeholder="Review notes (optional)"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={() => reviewMutation.mutate('APPROVED')} disabled={reviewMutation.isPending} className="btn-primary btn-sm gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button onClick={() => setShowReject(true)} className="btn-secondary btn-sm gap-1.5 text-red-600">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          )}
          {application.status === 'INTERNAL_CONTROL_REVIEW' && hasPermission('loan_applications:internal_control_approve') && !showReject && (
            <div className="w-full space-y-2"><input className="form-input text-xs h-8 max-w-sm" placeholder="Internal control notes" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} /><div className="flex gap-2"><button onClick={() => workflowMutation.mutate('APPROVE')} disabled={workflowMutation.isPending} className="btn-primary btn-sm gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Approve to Accounting</button><button onClick={() => setShowReject(true)} className="btn-secondary btn-sm gap-1.5"><XCircle className="w-3.5 h-3.5" /> Reject / Return</button></div></div>
          )}
          {application.status === 'ACCOUNTING_REVIEW' && hasPermission('loan_applications:disburse') && !showReject && (
            <div className="w-full space-y-2"><input className="form-input text-xs h-8 max-w-sm" placeholder="Accounting verification notes" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} /><button onClick={() => workflowMutation.mutate('APPROVE')} disabled={workflowMutation.isPending} className="btn-primary btn-sm gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Approve for Disbursement</button></div>
          )}
          {application.status === 'APPROVED' && hasPermission('loan_applications:disburse_head') && (
            <button onClick={() => disburseMutation.mutate()} disabled={disburseMutation.isPending} className="btn-primary btn-sm gap-1.5">
              <Banknote className="w-3.5 h-3.5" /> {disburseMutation.isPending ? 'Disbursing…' : 'Disburse Loan'}
            </button>
          )}
        </div>

        {showReject && (
          <div className="border-t border-gray-100 p-4 bg-red-50/50 space-y-3">
            <textarea
              className="form-input" rows={2} placeholder="Rejection reason (required)"
              value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => reviewMutation.mutate('REJECTED')}
                disabled={!rejectReason || reviewMutation.isPending}
                className="btn-primary btn-sm bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
              <button onClick={() => setShowReject(false)} className="btn-ghost btn-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Guarantors & Collateral — only editable while DRAFT */}
      {(application.loanProduct || application.status === 'DRAFT') && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card">
            <div className="card-header"><h3 className="text-sm font-semibold text-gray-700">Guarantors</h3></div>
            <div className="card-body space-y-3">
              {application.guarantors?.map((g) => (
                <div key={g.id} className="p-2.5 bg-gray-50 rounded-lg text-xs">
                  <p className="font-medium text-gray-800">{g.firstName} {g.lastName}</p>
                  <p className="text-gray-500">{g.phone} {g.relationship ? `· ${g.relationship}` : ''}</p>
                </div>
              ))}
              {application.status === 'DRAFT' && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <input className="form-input text-xs h-8" placeholder="First name" value={guarantorForm.firstName} onChange={(e) => setGuarantorForm((f) => ({ ...f, firstName: e.target.value }))} />
                    <input className="form-input text-xs h-8" placeholder="Last name" value={guarantorForm.lastName} onChange={(e) => setGuarantorForm((f) => ({ ...f, lastName: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="form-input text-xs h-8" placeholder="Phone" value={guarantorForm.phone} onChange={(e) => setGuarantorForm((f) => ({ ...f, phone: e.target.value }))} />
                    <input className="form-input text-xs h-8" placeholder="Relationship" value={guarantorForm.relationship} onChange={(e) => setGuarantorForm((f) => ({ ...f, relationship: e.target.value }))} />
                  </div>
                  <button
                    onClick={() => addGuarantorMutation.mutate()}
                    disabled={!guarantorForm.firstName || !guarantorForm.lastName || !guarantorForm.phone}
                    className="btn-secondary btn-sm gap-1.5 w-full disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Guarantor
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="text-sm font-semibold text-gray-700">Collateral</h3></div>
            <div className="card-body space-y-3">
              {application.collaterals?.map((c) => (
                <div key={c.id} className="p-2.5 bg-gray-50 rounded-lg text-xs">
                  <p className="font-medium text-gray-800">{c.description}</p>
                  {c.estimatedValue && <p className="text-gray-500">Est. ₦{Number(c.estimatedValue).toLocaleString()}</p>}
                </div>
              ))}
              {application.status === 'DRAFT' && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <input className="form-input text-xs h-8" placeholder="Description" value={collateralForm.description} onChange={(e) => setCollateralForm((f) => ({ ...f, description: e.target.value }))} />
                  <input type="number" className="form-input text-xs h-8" placeholder="Estimated value" value={collateralForm.estimatedValue} onChange={(e) => setCollateralForm((f) => ({ ...f, estimatedValue: e.target.value }))} />
                  <button
                    onClick={() => addCollateralMutation.mutate()}
                    disabled={!collateralForm.description}
                    className="btn-secondary btn-sm gap-1.5 w-full disabled:opacity-50"
                  >
                    <Landmark className="w-3.5 h-3.5" /> Add Collateral
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Virtual Account — auto-created on disbursement */}
      {application.loan && (
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Wallet className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Virtual Account</h3>
          </div>
          <div className="card-body">
            {!virtualAccount ? (
              <p className="text-xs text-gray-500">Account not yet created — this happens automatically a few seconds after disbursement. Refresh to check again.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-500">Account Number</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-lg font-bold text-gray-900 font-mono">{virtualAccount.accountNumber}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(virtualAccount.accountNumber); toast.success('Account number copied'); }}
                        className="btn-ghost btn-icon w-6 h-6"
                      >
                        <Copy className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bank</p>
                    <p className="text-sm font-medium text-gray-800">{virtualAccount.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Account Name</p>
                    <p className="text-sm font-medium text-gray-800">{virtualAccount.accountName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Provider</p>
                    <Badge variant={virtualAccount.provider === 'LOCAL' ? 'gray' : 'blue'}>{virtualAccount.provider}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <Badge variant={virtualAccount.status === 'ACTIVE' ? 'green' : 'gray'}>{virtualAccount.status}</Badge>
                  </div>
                </div>

                {virtualAccount.provider === 'LOCAL' && hasPermission('virtual_accounts:simulate') && application.loan.status === 'ACTIVE' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-end gap-2">
                    <div>
                      <label className="form-label text-xs">Simulate incoming payment (testing only)</label>
                      <input type="number" className="form-input h-9 w-40" placeholder="Amount" value={simulateAmount} onChange={(e) => setSimulateAmount(e.target.value)} />
                    </div>
                    <button
                      onClick={() => simulatePaymentMutation.mutate()}
                      disabled={!simulateAmount || simulatePaymentMutation.isPending}
                      className="btn-secondary btn-sm gap-1.5 disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" /> {simulatePaymentMutation.isPending ? 'Simulating…' : 'Simulate Payment'}
                    </button>
                  </div>
                )}

                {(virtualAccount.transactions?.length ?? 0) > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-600 mb-2">Incoming Transfers</p>
                    <table className="table text-xs">
                      <thead><tr><th>Reference</th><th>Amount</th><th>Payer</th><th>Status</th><th>Received</th><th></th></tr></thead>
                      <tbody>
                        {virtualAccount.transactions!.map((tx) => (
                          <tr key={tx.id}>
                            <td className="font-mono">{tx.providerReference}</td>
                            <td className="font-medium">₦{Number(tx.amount).toLocaleString()}</td>
                            <td>{tx.payerName ?? '—'}</td>
                            <td>
                              <Badge variant={tx.status === 'RECONCILED' ? 'green' : tx.status === 'MATCHED' ? 'blue' : 'yellow'}>{tx.status}</Badge>
                            </td>
                            <td className="text-gray-500">{formatDateTime(tx.receivedAt)}</td>
                            <td>
                              {tx.repaymentTransactionId && (
                                <button
                                  onClick={() => receiptsService.viewReceipt(tx.repaymentTransactionId!).catch(() => toast.error('Failed to load receipt'))}
                                  className="text-brand-600 hover:underline flex items-center gap-1"
                                >
                                  <Receipt className="w-3 h-3" /> Receipt
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Repayment schedule + record-payment — only once disbursed */}
      {application.loan && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Loan {application.loan.loanNumber} — {application.loan.status}</h3>
            <p className="text-xs text-gray-500">Total repayable: ₦{Number(application.loan.totalRepayable).toLocaleString()}</p>
          </div>
          <div className="card-body">
            <table className="table text-xs mb-4">
              <thead><tr><th>#</th><th>Due</th><th>Principal</th><th>Interest</th><th>Total</th><th>Paid</th><th>Status</th></tr></thead>
              <tbody>
                {application.loan.installments.map((inst) => (
                  <tr key={inst.id}>
                    <td>{inst.installmentNumber}</td>
                    <td>{formatDate(inst.dueDate)}</td>
                    <td>₦{Number(inst.principalDue).toLocaleString()}</td>
                    <td>₦{Number(inst.interestDue).toLocaleString()}</td>
                    <td className="font-medium">₦{Number(inst.totalDue).toLocaleString()}</td>
                    <td>₦{Number(inst.amountPaid).toLocaleString()}</td>
                    <td><Badge variant={inst.status === 'PAID' ? 'green' : inst.status === 'PARTIALLY_PAID' ? 'yellow' : 'gray'}>{inst.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {application.loan.status === 'ACTIVE' && hasPermission('loan_applications:record_repayment') && (
              <div className="flex items-end gap-2 pt-3 border-t border-gray-100">
                <div>
                  <label className="form-label text-xs">Record a repayment</label>
                  <input type="number" className="form-input h-9 w-40" placeholder="Amount" value={repaymentAmount} onChange={(e) => setRepaymentAmount(e.target.value)} />
                </div>
                <button onClick={() => repaymentMutation.mutate()} disabled={!repaymentAmount || repaymentMutation.isPending} className="btn-primary btn-sm disabled:opacity-50">
                  {repaymentMutation.isPending ? 'Recording…' : 'Record Payment'}
                </button>
              </div>
            )}

            {application.loan.transactions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-600 mb-2">Payment History</p>
                {application.loan.transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center text-xs py-1.5 text-gray-600 border-b border-gray-50 last:border-0">
                    <span>₦{Number(tx.amount).toLocaleString()} ({tx.method}){tx.receiptNumber && <span className="text-gray-400 font-mono"> · {tx.receiptNumber}</span>}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{formatDateTime(tx.createdAt)}</span>
                      <button
                        onClick={() => receiptsService.viewReceipt(tx.id).catch(() => toast.error('Failed to load receipt'))}
                        className="text-brand-600 hover:underline flex items-center gap-1"
                      >
                        <Receipt className="w-3 h-3" /> Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transport Request — visible to compliance officers for active applications */}
      {hasPermission('loan_applications:compliance_review') && application.status !== 'DRAFT' && application.status !== 'CANCELLED' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Transport Request</h3>
            </div>
            {!showTransportForm && (
              <button onClick={() => setShowTransportForm(true)} className="btn-secondary btn-sm gap-1.5">
                <Car className="w-3.5 h-3.5" /> Request Transport
              </button>
            )}
          </div>

          {showTransportForm && (
            <div className="card-body space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Purpose <span className="text-red-500">*</span></label>
                  <input className="form-input" placeholder="e.g. Field verification visit" value={transportForm.purpose} onChange={(e) => setTransportForm((f) => ({ ...f, purpose: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Location <span className="text-red-500">*</span></label>
                  <input className="form-input" placeholder="Customer address or area" value={transportForm.location} onChange={(e) => setTransportForm((f) => ({ ...f, location: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Number of Customers to Visit <span className="text-red-500">*</span></label>
                  <input type="number" min="1" className="form-input" placeholder="e.g. 5" value={transportForm.customerCount} onChange={(e) => setTransportForm((f) => ({ ...f, customerCount: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Distance (km)</label>
                  <input type="number" className="form-input" placeholder="Estimated km" value={transportForm.distanceKm} onChange={(e) => setTransportForm((f) => ({ ...f, distanceKm: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Estimated Cost (₦)</label>
                  <input type="number" className="form-input" placeholder="Your cost estimate" value={transportForm.estimatedCost} onChange={(e) => setTransportForm((f) => ({ ...f, estimatedCost: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Suggested Allowance (₦)</label>
                  <input type="number" className="form-input" placeholder="Amount you are requesting" value={transportForm.suggestedAmount} onChange={(e) => setTransportForm((f) => ({ ...f, suggestedAmount: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => transportMutation.mutate()}
                  disabled={!transportForm.purpose || !transportForm.location || !transportForm.customerCount || transportMutation.isPending}
                  className="btn-primary btn-sm disabled:opacity-50"
                >
                  {transportMutation.isPending ? 'Submitting…' : 'Submit Request'}
                </button>
                <button onClick={() => setShowTransportForm(false)} className="btn-ghost btn-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
