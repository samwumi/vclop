import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  recoveryService,
  type RecoveryStatus,
  type PriorityLevel,
  type ActivityType,
  type ContactMethod,
  type ContactOutcome,
  type PaymentStatus,
  type PromiseStatus,
  type ExpenseType,
} from '@/services/recovery.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<RecoveryStatus, { label: string; variant: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple' }> = {
  PENDING_VERIFICATION: { label: 'Pending Verification', variant: 'gray' },
  ASSIGNED: { label: 'Assigned', variant: 'blue' },
  IN_PROGRESS: { label: 'In Progress', variant: 'blue' },
  PROMISE_ACTIVE: { label: 'Promise Active', variant: 'purple' },
  LEGAL_ACTION: { label: 'Legal Action', variant: 'red' },
  PARTIALLY_RECOVERED: { label: 'Partially Recovered', variant: 'yellow' },
  FULLY_RECOVERED: { label: 'Fully Recovered', variant: 'green' },
  WRITTEN_OFF: { label: 'Written Off', variant: 'gray' },
  CLOSED: { label: 'Closed', variant: 'gray' },
};

const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; variant: 'green' | 'red' | 'yellow' | 'blue' | 'gray' }> = {
  LOW: { label: 'Low', variant: 'gray' },
  MEDIUM: { label: 'Medium', variant: 'blue' },
  HIGH: { label: 'High', variant: 'yellow' },
  URGENT: { label: 'Urgent', variant: 'red' },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; variant: 'green' | 'red' | 'yellow' | 'blue' | 'gray' }> = {
  PENDING_VERIFICATION: { label: 'Pending', variant: 'yellow' },
  VERIFIED: { label: 'Verified', variant: 'green' },
  REJECTED: { label: 'Rejected', variant: 'red' },
};

const PROMISE_STATUS_CONFIG: Record<PromiseStatus, { label: string; variant: 'green' | 'red' | 'yellow' | 'blue' | 'gray' }> = {
  ACTIVE: { label: 'Active', variant: 'blue' },
  KEPT: { label: 'Kept', variant: 'green' },
  PARTIAL: { label: 'Partial', variant: 'yellow' },
  BROKEN: { label: 'Broken', variant: 'red' },
  CANCELLED: { label: 'Cancelled', variant: 'gray' },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function RecoveryAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'payments' | 'promises' | 'expenses'>('overview');

  // Activity form
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>('PHONE_CALL');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('PHONE');
  const [contactOutcome, setContactOutcome] = useState<ContactOutcome>('CONTACTED');
  const [activityNotes, setActivityNotes] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Promise form
  const [showPromiseForm, setShowPromiseForm] = useState(false);
  const [promiseAmount, setPromiseAmount] = useState('');
  const [promiseDate, setPromiseDate] = useState('');
  const [promiseNotes, setPromiseNotes] = useState('');

  // Expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseType, setExpenseType] = useState<ExpenseType>('FUEL');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseDescription, setExpenseDescription] = useState('');

  const { data: account, isLoading } = useQuery({
    queryKey: ['recovery', 'account', id],
    queryFn: () => recoveryService.getAccount(id!),
    enabled: !!id,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['recovery', 'account', id] });

  // Mutations
  const activityMutation = useMutation({
    mutationFn: () =>
      recoveryService.createActivity({
        accountId: id!,
        activityType,
        contactMethod,
        contactOutcome,
        notes: activityNotes,
        nextFollowupDate: nextFollowup || undefined,
      }),
    onSuccess: () => {
      toast.success('Activity logged');
      setActivityNotes('');
      setNextFollowup('');
      setShowActivityForm(false);
      invalidate();
    },
    onError: () => toast.error('Failed to log activity'),
  });

  const paymentMutation = useMutation({
    mutationFn: () =>
      recoveryService.recordPayment({
        accountId: id!,
        amount: Number(paymentAmount),
        paymentDate,
        paymentMethod,
        reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
      }),
    onSuccess: () => {
      toast.success('Payment recorded - pending verification');
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      setShowPaymentForm(false);
      invalidate();
    },
    onError: () => toast.error('Failed to record payment'),
  });

  const promiseMutation = useMutation({
    mutationFn: () =>
      recoveryService.createPromise({
        accountId: id!,
        promisedAmount: Number(promiseAmount),
        promisedDate: promiseDate,
        promiseNotes: promiseNotes || undefined,
      }),
    onSuccess: () => {
      toast.success('Promise recorded');
      setPromiseAmount('');
      setPromiseDate('');
      setPromiseNotes('');
      setShowPromiseForm(false);
      invalidate();
    },
    onError: () => toast.error('Failed to record promise'),
  });

  const expenseMutation = useMutation({
    mutationFn: () =>
      recoveryService.createExpense({
        accountId: id!,
        expenseType,
        amount: Number(expenseAmount),
        expenseDate,
        description: expenseDescription || undefined,
      }),
    onSuccess: () => {
      toast.success('Expense recorded');
      setExpenseAmount('');
      setExpenseDescription('');
      setShowExpenseForm(false);
      invalidate();
    },
    onError: () => toast.error('Failed to record expense'),
  });

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>Account not found</p>
        </div>
      </div>
    );
  }

  const recoveryRate = account.originalPrincipal > 0
    ? (account.recoveredAmount / account.originalPrincipal) * 100
    : 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-mobile">
        <Breadcrumbs />
        <div className="flex-mobile-col items-start md:items-center justify-between mt-3 md:mt-4 gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/recovery/accounts')} className="btn-ghost btn-icon">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-responsive-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {account.accountNumber}
              </h1>
              <p className="text-responsive-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {account.customerName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_CONFIG[account.status].variant}>
              {STATUS_CONFIG[account.status].label}
            </Badge>
            <Badge variant={PRIORITY_CONFIG[account.priorityLevel].variant}>
              {PRIORITY_CONFIG[account.priorityLevel].label}
            </Badge>
            <Badge variant={account.source === 'LEGACY' ? 'blue' : 'green'}>
              {account.source === 'LEGACY' ? 'Historical' : 'VCLOP'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6 p-mobile md:p-0">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="card-mobile">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                    Outstanding Balance
                  </p>
                  <p className="text-responsive-xl font-bold mt-1 text-red-600">
                    {formatCurrency(account.outstandingBalance)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600 opacity-20" />
              </div>
            </div>
          </div>

          <div className="card-mobile">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                    Recovered Amount
                  </p>
                  <p className="text-responsive-xl font-bold mt-1 text-green-600">
                    {formatCurrency(account.recoveredAmount)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </div>
          </div>

          <div className="card-mobile">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                    Net Recovery
                  </p>
                  <p className="text-responsive-xl font-bold mt-1 text-emerald-600">
                    {formatCurrency(account.netRecovery)}
                  </p>
                  <p className="text-responsive-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Expenses: {formatCurrency(account.totalExpenses)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-600 opacity-20" />
              </div>
            </div>
          </div>

          <div className="card-mobile">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                    Recovery Rate
                  </p>
                  <p className="text-responsive-xl font-bold mt-1" style={{ color: 'var(--brand-primary)' }}>
                    {recoveryRate.toFixed(1)}%
                  </p>
                  <p className="text-responsive-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    of {formatCurrency(account.originalPrincipal)}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-600 opacity-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card-mobile">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {(['overview', 'activities', 'payments', 'promises', 'expenses'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-responsive-sm font-medium transition-colors capitalize whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="card-body">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="text-responsive-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                          Phone
                        </p>
                        <p className="text-responsive-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {account.customerPhone}
                        </p>
                      </div>
                    </div>
                    {account.customerEmail && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                            Email
                          </p>
                          <p className="text-responsive-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {account.customerEmail}
                          </p>
                        </div>
                      </div>
                    )}
                    {account.customerAddress && (
                      <div className="flex items-start gap-3 md:col-span-2">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                            Address
                          </p>
                          <p className="text-responsive-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {account.customerAddress}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Loan Information */}
                <div>
                  <h3 className="text-responsive-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Loan Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                        Original Principal
                      </p>
                      <p className="text-responsive-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(account.originalPrincipal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                        Disbursement Date
                      </p>
                      <p className="text-responsive-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatDate(account.disbursementDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                        Historical Repayments
                      </p>
                      <p className="text-responsive-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(account.historicalRepayments)}
                      </p>
                    </div>
                    {account.originalReference && (
                      <div>
                        <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                          Original Reference
                        </p>
                        <p className="text-responsive-sm font-medium font-mono" style={{ color: 'var(--text-primary)' }}>
                          {account.originalReference}
                        </p>
                      </div>
                    )}
                    {account.lastPaymentDate && (
                      <>
                        <div>
                          <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                            Last Payment Date
                          </p>
                          <p className="text-responsive-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatDate(account.lastPaymentDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                            Last Payment Amount
                          </p>
                          <p className="text-responsive-sm font-semibold text-green-600">
                            {formatCurrency(account.lastPaymentAmount || 0)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Assignment Information */}
                {account.assignedOfficer && (
                  <div>
                    <h3 className="text-responsive-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                      Assignment
                    </h3>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                        {account.assignedOfficer.firstName[0]}{account.assignedOfficer.lastName[0]}
                      </div>
                      <div>
                        <p className="text-responsive-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {account.assignedOfficer.firstName} {account.assignedOfficer.lastName}
                        </p>
                        <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                          Assigned {account.assignedDate ? formatDate(account.assignedDate) : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {account.notes && (
                  <div>
                    <h3 className="text-responsive-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                      Notes
                    </h3>
                    <p className="text-responsive-sm p-4 bg-gray-50 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
                      {account.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div className="space-y-4">
                {hasPermission('recovery:activities_create') && (
                  <button
                    onClick={() => setShowActivityForm(!showActivityForm)}
                    className="btn-primary btn-responsive"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Activity</span>
                  </button>
                )}

                {showActivityForm && (
                  <div className="card-mobile border-2 border-blue-200">
                    <div className="card-body space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="form-label">Activity Type</label>
                          <select
                            className="form-input"
                            value={activityType}
                            onChange={(e) => setActivityType(e.target.value as ActivityType)}
                          >
                            <option value="PHONE_CALL">Phone Call</option>
                            <option value="SMS_SENT">SMS Sent</option>
                            <option value="EMAIL_SENT">Email Sent</option>
                            <option value="FIELD_VISIT">Field Visit</option>
                            <option value="OFFICE_VISIT">Office Visit</option>
                            <option value="NEGOTIATION">Negotiation</option>
                            <option value="PROMISE_RECEIVED">Promise Received</option>
                            <option value="LEGAL_NOTICE">Legal Notice</option>
                            <option value="PAYMENT_RECEIVED">Payment Received</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label">Contact Method</label>
                          <select
                            className="form-input"
                            value={contactMethod}
                            onChange={(e) => setContactMethod(e.target.value as ContactMethod)}
                          >
                            <option value="PHONE">Phone</option>
                            <option value="SMS">SMS</option>
                            <option value="EMAIL">Email</option>
                            <option value="IN_PERSON">In Person</option>
                            <option value="WHATSAPP">WhatsApp</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Outcome</label>
                        <select
                          className="form-input"
                          value={contactOutcome}
                          onChange={(e) => setContactOutcome(e.target.value as ContactOutcome)}
                        >
                          <option value="CONTACTED">Contacted</option>
                          <option value="NO_ANSWER">No Answer</option>
                          <option value="WRONG_NUMBER">Wrong Number</option>
                          <option value="PROMISED_PAYMENT">Promised Payment</option>
                          <option value="REFUSED_TO_PAY">Refused to Pay</option>
                          <option value="PARTIAL_AGREEMENT">Partial Agreement</option>
                          <option value="HOSTILE">Hostile</option>
                          <option value="NOT_FOUND">Not Found</option>
                          <option value="PENDING_CALLBACK">Pending Callback</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Notes *</label>
                        <textarea
                          className="form-input"
                          rows={3}
                          placeholder="What happened? What was discussed?"
                          value={activityNotes}
                          onChange={(e) => setActivityNotes(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">Next Followup Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={nextFollowup}
                          onChange={(e) => setNextFollowup(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => activityMutation.mutate()}
                          disabled={!activityNotes || activityMutation.isPending}
                          className="btn-primary"
                        >
                          {activityMutation.isPending ? 'Logging...' : 'Log Activity'}
                        </button>
                        <button onClick={() => setShowActivityForm(false)} className="btn-ghost">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activities List */}
                <div className="space-y-2">
                  {account.activities && account.activities.length > 0 ? (
                    account.activities.map((activity) => (
                      <div key={activity.id} className="card-mobile border">
                        <div className="card-body">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="blue">{activity.activityType.replace(/_/g, ' ')}</Badge>
                              {activity.contactMethod && (
                                <span className="text-responsive-xs" style={{ color: 'var(--text-muted)' }}>
                                  via {activity.contactMethod}
                                </span>
                              )}
                            </div>
                            <span className="text-responsive-xs" style={{ color: 'var(--text-muted)' }}>
                              {formatDateTime(activity.activityDate)}
                            </span>
                          </div>
                          {activity.contactOutcome && (
                            <p className="text-responsive-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                              Outcome: <strong>{activity.contactOutcome.replace(/_/g, ' ')}</strong>
                            </p>
                          )}
                          {activity.notes && (
                            <p className="text-responsive-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                              {activity.notes}
                            </p>
                          )}
                          {activity.nextFollowupDate && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <Clock className="w-4 h-4" />
                              <span className="text-responsive-xs">
                                Next followup: {formatDate(activity.nextFollowupDate)}
                              </span>
                            </div>
                          )}
                          {activity.recordedBy && (
                            <p className="text-responsive-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                              Logged by {activity.recordedBy.firstName} {activity.recordedBy.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-responsive-sm" style={{ color: 'var(--text-secondary)' }}>
                        No activities logged yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                {hasPermission('recovery:payments_record') && (
                  <button
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                    className="btn-primary btn-responsive"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Record Payment</span>
                  </button>
                )}

                {showPaymentForm && (
                  <div className="card-mobile border-2 border-green-200">
                    <div className="card-body space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="form-label">Amount *</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="0.00"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="form-label">Payment Date *</label>
                          <input
                            type="date"
                            className="form-input"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="form-label">Payment Method *</label>
                          <select
                            className="form-input"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Mobile Money">Mobile Money</option>
                            <option value="Check">Check</option>
                            <option value="POS">POS</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label">Reference</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Transaction reference"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Notes</label>
                        <textarea
                          className="form-input"
                          rows={2}
                          placeholder="Additional notes"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => paymentMutation.mutate()}
                          disabled={!paymentAmount || !paymentDate || paymentMutation.isPending}
                          className="btn-primary"
                        >
                          {paymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                        </button>
                        <button onClick={() => setShowPaymentForm(false)} className="btn-ghost">
                          Cancel
                        </button>
                      </div>
                      <p className="text-responsive-xs" style={{ color: 'var(--text-muted)' }}>
                        ⚠️ Payment will be pending until verified by Accounting Head
                      </p>
                    </div>
                  </div>
                )}

                {/* Payments List */}
                <div className="space-y-2">
                  {account.payments && account.payments.length > 0 ? (
                    account.payments.map((payment) => {
                      const statusConfig = PAYMENT_STATUS_CONFIG[payment.status];
                      return (
                        <div key={payment.id} className="card-mobile border">
                          <div className="card-body">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-responsive-lg font-bold text-green-600">
                                  {formatCurrency(payment.amount)}
                                </p>
                                <p className="text-responsive-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                  {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                                </p>
                              </div>
                              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                            </div>
                            {payment.reference && (
                              <p className="text-responsive-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                                Ref: {payment.reference}
                              </p>
                            )}
                            {payment.notes && (
                              <p className="text-responsive-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                                {payment.notes}
                              </p>
                            )}
                            {payment.status === 'VERIFIED' && payment.verifiedBy && (
                              <div className="flex items-center gap-2 text-green-600 mt-2">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-responsive-xs">
                                  Verified by {payment.verifiedBy.firstName} {payment.verifiedBy.lastName} on{' '}
                                  {formatDate(payment.verifiedAt!)}
                                </span>
                              </div>
                            )}
                            {payment.status === 'REJECTED' && (
                              <div className="flex items-center gap-2 text-red-600 mt-2">
                                <XCircle className="w-4 h-4" />
                                <span className="text-responsive-xs">
                                  Rejected: {payment.rejectionReason}
                                </span>
                              </div>
                            )}
                            {payment.recordedBy && (
                              <p className="text-responsive-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                                Recorded by {payment.recordedBy.firstName} {payment.recordedBy.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-responsive-sm" style={{ color: 'var(--text-secondary)' }}>
                        No payments recorded yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Promises Tab */}
            {activeTab === 'promises' && (
              <div className="space-y-4">
                {hasPermission('recovery:promises_create') && (
                  <button
                    onClick={() => setShowPromiseForm(!showPromiseForm)}
                    className="btn-primary btn-responsive"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Record Promise</span>
                  </button>
                )}

                {showPromiseForm && (
                  <div className="card-mobile border-2 border-purple-200">
                    <div className="card-body space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="form-label">Promised Amount *</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="0.00"
                            value={promiseAmount}
                            onChange={(e) => setPromiseAmount(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="form-label">Promised Date *</label>
                          <input
                            type="date"
                            className="form-input"
                            value={promiseDate}
                            onChange={(e) => setPromiseDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Notes</label>
                        <textarea
                          className="form-input"
                          rows={2}
                          placeholder="Additional notes about the promise"
                          value={promiseNotes}
                          onChange={(e) => setPromiseNotes(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => promiseMutation.mutate()}
                          disabled={!promiseAmount || !promiseDate || promiseMutation.isPending}
                          className="btn-primary"
                        >
                          {promiseMutation.isPending ? 'Recording...' : 'Record Promise'}
                        </button>
                        <button onClick={() => setShowPromiseForm(false)} className="btn-ghost">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Promises List */}
                <div className="space-y-2">
                  {account.promises && account.promises.length > 0 ? (
                    account.promises.map((promise) => {
                      const statusConfig = PROMISE_STATUS_CONFIG[promise.status];
                      return (
                        <div key={promise.id} className="card-mobile border">
                          <div className="card-body">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-responsive-lg font-bold text-purple-600">
                                  {formatCurrency(promise.promisedAmount)}
                                </p>
                                <p className="text-responsive-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                  Promised for {formatDate(promise.promisedDate)}
                                </p>
                              </div>
                              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                            </div>
                            {promise.promiseNotes && (
                              <p className="text-responsive-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                                {promise.promiseNotes}
                              </p>
                            )}
                            {promise.actualPaidAmount && (
                              <p className="text-responsive-sm text-green-600 mt-2">
                                Paid: {formatCurrency(promise.actualPaidAmount)} on{' '}
                                {formatDate(promise.actualPaidDate!)}
                              </p>
                            )}
                            {promise.recordedBy && (
                              <p className="text-responsive-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                                Recorded by {promise.recordedBy.firstName} {promise.recordedBy.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-responsive-sm" style={{ color: 'var(--text-secondary)' }}>
                        No promises recorded yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Expenses Tab */}
            {activeTab === 'expenses' && (
              <div className="space-y-4">
                {hasPermission('recovery:expenses_create') && (
                  <button
                    onClick={() => setShowExpenseForm(!showExpenseForm)}
                    className="btn-primary btn-responsive"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Record Expense</span>
                  </button>
                )}

                {showExpenseForm && (
                  <div className="card-mobile border-2 border-orange-200">
                    <div className="card-body space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="form-label">Expense Type *</label>
                          <select
                            className="form-input"
                            value={expenseType}
                            onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
                          >
                            <option value="FUEL">Fuel</option>
                            <option value="LEGAL_FEES">Legal Fees</option>
                            <option value="COURT_FEES">Court Fees</option>
                            <option value="INVESTIGATION">Investigation</option>
                            <option value="COMMUNICATION">Communication</option>
                            <option value="TRAVEL">Travel</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label">Amount *</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="0.00"
                            value={expenseAmount}
                            onChange={(e) => setExpenseAmount(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Date *</label>
                        <input
                          type="date"
                          className="form-input"
                          value={expenseDate}
                          onChange={(e) => setExpenseDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-input"
                          rows={2}
                          placeholder="Describe the expense"
                          value={expenseDescription}
                          onChange={(e) => setExpenseDescription(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => expenseMutation.mutate()}
                          disabled={!expenseAmount || !expenseDate || expenseMutation.isPending}
                          className="btn-primary"
                        >
                          {expenseMutation.isPending ? 'Recording...' : 'Record Expense'}
                        </button>
                        <button onClick={() => setShowExpenseForm(false)} className="btn-ghost">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expenses List */}
                <div className="space-y-2">
                  {account.expenses && account.expenses.length > 0 ? (
                    account.expenses.map((expense) => (
                      <div key={expense.id} className="card-mobile border">
                        <div className="card-body">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-responsive-lg font-bold text-orange-600">
                                {formatCurrency(expense.amount)}
                              </p>
                              <p className="text-responsive-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {formatDate(expense.expenseDate)}
                              </p>
                            </div>
                            <Badge variant="yellow">{expense.expenseType.replace(/_/g, ' ')}</Badge>
                          </div>
                          {expense.description && (
                            <p className="text-responsive-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                              {expense.description}
                            </p>
                          )}
                          {expense.recordedBy && (
                            <p className="text-responsive-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                              Recorded by {expense.recordedBy.firstName} {expense.recordedBy.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-responsive-sm" style={{ color: 'var(--text-secondary)' }}>
                        No expenses recorded yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
