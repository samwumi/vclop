import { useQuery } from '@tanstack/react-query';
import {
  Activity, AlertTriangle, Banknote, BarChart2, Building2,
  Car, CheckCircle2, ClipboardList, FileCheck2, FileText,
  GitBranch, Landmark, ShieldAlert, Target, TrendingDown, TrendingUp, Users, Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { dashboardService } from '@/services/dashboard.service';
import { performanceService } from '@/services/performance.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { StatCard } from './widgets/StatCard';
import { LoginActivityChart } from './widgets/LoginActivityChart';
import { UserStatusChart } from './widgets/UserStatusChart';
import { RecentAuditTable } from './widgets/RecentAuditTable';
import { SystemHealthWidget } from './widgets/SystemHealthWidget';

// ── Reusable small components ─────────────────────────────────────────────────

function OpCard({
  title, value, icon: Icon, color, onClick,
}: {
  title: string; value: number | string; icon: typeof ClipboardList; color: string; onClick?: () => void;
}) {
  return (
    <div
      className={`card p-5 flex items-start gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({
  label, icon: Icon, color, onClick,
}: {
  label: string; icon: typeof FileText; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-center`}
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs font-medium text-gray-700 leading-tight">{label}</p>
    </button>
  );
}

function ProgressBar({ pct, color = 'bg-brand-600' }: { pct: number; color?: string }) {
  const safe = Math.min(100, Math.max(0, pct));
  return (
    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${safe}%` }} />
    </div>
  );
}

// ── Role panels ──────────────────────────────────────────────────────────────

function LoanOfficerPanel({ summary, performance }: {
  summary: Awaited<ReturnType<typeof dashboardService.operationalSummary>>;
  performance: Awaited<ReturnType<typeof performanceService.mine>> | undefined;
}) {
  const navigate = useNavigate();
  const weekNo = Math.ceil(new Date().getDate() / 7);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OpCard title="My Applications" value={summary.applications} icon={FileText} color="bg-blue-50 text-blue-600" onClick={() => navigate('/loans')} />
        <OpCard title="Pending Tasks" value={summary.myTasks} icon={ClipboardList} color="bg-violet-50 text-violet-600" />
        <OpCard title="Disbursed (MTD)" value={performance?.monthlyDisbursements ?? 0} icon={Banknote} color="bg-emerald-50 text-emerald-600" />
        <OpCard title={`Week ${weekNo} Allowance`} value={`₦${(performance?.weeklyAllowance ?? 0).toLocaleString()}`} icon={Wallet} color="bg-orange-50 text-orange-600" onClick={() => navigate('/performance')} />
      </div>

      {/* Monthly target card */}
      {(performance?.monthlyTarget ?? 0) > 0 && (
        <div className="card p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/performance')}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Monthly Disbursement Target</p>
              <p className="text-xs text-gray-500 mt-0.5">
                ₦{(performance!.currentAchievement).toLocaleString()} of ₦{(performance!.monthlyTarget).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {performance!.progressPercentage >= 100
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                : <Target className="w-5 h-5 text-brand-600" />}
              <p className="text-lg font-bold text-brand-700">{performance!.progressPercentage.toFixed(0)}%</p>
            </div>
          </div>
          <ProgressBar
            pct={performance!.progressPercentage}
            color={performance!.progressPercentage >= 100 ? 'bg-emerald-500' : performance!.progressPercentage >= 60 ? 'bg-brand-600' : 'bg-amber-500'}
          />
          <p className="text-xs text-gray-400 mt-2">₦{(performance!.remainingTarget).toLocaleString()} remaining to target</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="card p-5">
        <p className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction label="New Customer" icon={Users} color="bg-blue-50 text-blue-600" onClick={() => navigate('/customers/new')} />
          <QuickAction label="New Application" icon={FileText} color="bg-emerald-50 text-emerald-600" onClick={() => navigate('/loans/new')} />
          <QuickAction label="My Applications" icon={TrendingUp} color="bg-violet-50 text-violet-600" onClick={() => navigate('/loans')} />
          <QuickAction label="My Performance" icon={Target} color="bg-orange-50 text-orange-600" onClick={() => navigate('/performance')} />
        </div>
      </div>
    </div>
  );
}

function CompliancePanel({ summary }: { summary: Awaited<ReturnType<typeof dashboardService.operationalSummary>> }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OpCard title="Review Queue" value={summary.complianceQueue} icon={FileCheck2} color="bg-violet-50 text-violet-600" onClick={() => navigate('/compliance')} />
        <OpCard title="Pending Tasks" value={summary.myTasks} icon={ClipboardList} color="bg-blue-50 text-blue-600" />
        <OpCard title="Transport Requests" value={summary.transportRequests} icon={Car} color="bg-amber-50 text-amber-600" onClick={() => navigate('/transport')} />
        <OpCard title="All Applications" value={summary.applications} icon={FileText} color="bg-gray-50 text-gray-600" onClick={() => navigate('/loans')} />
      </div>
      <div className="card p-5">
        <p className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction label="Review Queue" icon={FileCheck2} color="bg-violet-50 text-violet-600" onClick={() => navigate('/compliance')} />
          <QuickAction label="All Loans" icon={FileText} color="bg-blue-50 text-blue-600" onClick={() => navigate('/loans')} />
          <QuickAction label="Transport Requests" icon={Car} color="bg-amber-50 text-amber-600" onClick={() => navigate('/transport')} />
          <QuickAction label="Customers" icon={Users} color="bg-emerald-50 text-emerald-600" onClick={() => navigate('/customers')} />
        </div>
      </div>
    </div>
  );
}

function AccountingPanel({ summary }: { summary: Awaited<ReturnType<typeof dashboardService.operationalSummary>> }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OpCard title="Pending Disbursement" value={summary.approvedLoans} icon={Landmark} color="bg-emerald-50 text-emerald-600" onClick={() => navigate('/accounting')} />
        <OpCard title="Pending Tasks" value={summary.myTasks} icon={ClipboardList} color="bg-blue-50 text-blue-600" />
        <OpCard title="All Applications" value={summary.applications} icon={FileText} color="bg-violet-50 text-violet-600" onClick={() => navigate('/loans')} />
        <OpCard title="Reports" value="View" icon={BarChart2} color="bg-gray-50 text-gray-600" onClick={() => navigate('/reports')} />
      </div>
      <div className="card p-5">
        <p className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction label="Disburse Loans" icon={Banknote} color="bg-emerald-50 text-emerald-600" onClick={() => navigate('/accounting')} />
          <QuickAction label="All Loans" icon={FileText} color="bg-blue-50 text-blue-600" onClick={() => navigate('/loans')} />
          <QuickAction label="Reports" icon={BarChart2} color="bg-violet-50 text-violet-600" onClick={() => navigate('/reports')} />
          <QuickAction label="Customers" icon={Users} color="bg-amber-50 text-amber-600" onClick={() => navigate('/customers')} />
        </div>
      </div>
    </div>
  );
}

function InternalControlPanel({ summary }: { summary: Awaited<ReturnType<typeof dashboardService.operationalSummary>> }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OpCard title="Review Queue" value={summary.icQueue ?? 0} icon={ShieldAlert} color="bg-violet-50 text-violet-600" onClick={() => navigate('/internal-control')} />
        <OpCard title="Pending Tasks" value={summary.myTasks} icon={ClipboardList} color="bg-blue-50 text-blue-600" />
        <OpCard title="All Applications" value={summary.applications} icon={FileText} color="bg-gray-50 text-gray-600" onClick={() => navigate('/loans')} />
        <OpCard title="Reports" value="View" icon={BarChart2} color="bg-emerald-50 text-emerald-600" onClick={() => navigate('/reports')} />
      </div>
      <div className="card p-5">
        <p className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction label="Review Queue" icon={ShieldAlert} color="bg-violet-50 text-violet-600" onClick={() => navigate('/internal-control')} />
          <QuickAction label="All Loans" icon={FileText} color="bg-blue-50 text-blue-600" onClick={() => navigate('/loans')} />
          <QuickAction label="Reports" icon={BarChart2} color="bg-emerald-50 text-emerald-600" onClick={() => navigate('/reports')} />
          <QuickAction label="Customers" icon={Users} color="bg-amber-50 text-amber-600" onClick={() => navigate('/customers')} />
        </div>
      </div>
    </div>
  );
}

function CollectionsPanel({ summary }: { summary: Awaited<ReturnType<typeof dashboardService.operationalSummary>> }) {  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OpCard title="Open Cases" value={summary.collectionCases} icon={TrendingDown} color="bg-red-50 text-red-600" onClick={() => navigate('/collections')} />
        <OpCard title="Overdue Installments" value={summary.overdueInstallments} icon={AlertTriangle} color="bg-amber-50 text-amber-600" onClick={() => navigate('/collections')} />
        <OpCard title="Pending Tasks" value={summary.myTasks} icon={ClipboardList} color="bg-blue-50 text-blue-600" />
        <OpCard title="All Loans" value={summary.applications} icon={FileText} color="bg-gray-50 text-gray-600" onClick={() => navigate('/loans')} />
      </div>
      <div className="card p-5">
        <p className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction label="Collections" icon={TrendingDown} color="bg-red-50 text-red-600" onClick={() => navigate('/collections')} />
          <QuickAction label="All Loans" icon={FileText} color="bg-blue-50 text-blue-600" onClick={() => navigate('/loans')} />
          <QuickAction label="Reports" icon={BarChart2} color="bg-violet-50 text-violet-600" onClick={() => navigate('/reports')} />
          <QuickAction label="Customers" icon={Users} color="bg-emerald-50 text-emerald-600" onClick={() => navigate('/customers')} />
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ summary, hasPermission }: {
  summary: Awaited<ReturnType<typeof dashboardService.operationalSummary>>;
  hasPermission: (p: string) => boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OpCard title="Compliance Queue"    value={summary.complianceQueue} icon={FileCheck2}  color="bg-violet-50 text-violet-600"  onClick={() => navigate('/compliance')} />
        <OpCard title="Internal Control"    value={summary.icQueue ?? 0}    icon={ShieldAlert}  color="bg-indigo-50 text-indigo-600"  onClick={() => navigate('/internal-control')} />
        <OpCard title="Pending Disbursement"value={summary.approvedLoans}   icon={Landmark}     color="bg-emerald-50 text-emerald-600" onClick={() => navigate('/accounting')} />
        <OpCard title="Open Collections"    value={summary.collectionCases} icon={TrendingDown} color="bg-red-50 text-red-600"         onClick={() => navigate('/collections')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {hasPermission('users:read') && <StatCard title="Total Users" queryKey={['dashboard', 'active-users']} queryFn={dashboardService.activeUsers} icon={Users} color="blue" />}
        {hasPermission('branches:read') && <StatCard title="Branches" queryKey={['dashboard', 'total-branches']} queryFn={dashboardService.totalBranches} icon={GitBranch} color="green" />}
        {hasPermission('departments:read') && <StatCard title="Departments" queryKey={['dashboard', 'total-departments']} queryFn={dashboardService.totalDepartments} icon={Building2} color="purple" />}
        {hasPermission('system:health') && (
          <div className="card p-5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div><p className="text-sm font-medium text-gray-500">Platform</p><p className="text-2xl font-bold text-gray-900 mt-0.5">Online</p></div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {hasPermission('audit:read') && <><LoginActivityChart /><UserStatusChart /></>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {hasPermission('audit:read') && <RecentAuditTable />}
        {hasPermission('system:health') && <div className="lg:col-span-1"><SystemHealthWidget /></div>}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user, hasPermission } = useAuthStore();

  useQuery({ queryKey: ['dashboard', 'bootstrap'], queryFn: dashboardService.bootstrap, staleTime: 60_000 });

  const { data: summary } = useQuery({
    queryKey: ['dashboard', 'operational-summary'],
    queryFn: dashboardService.operationalSummary,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: performance } = useQuery({
    queryKey: ['performance', 'me'],
    queryFn: performanceService.mine,
    staleTime: 60_000,
  });

  const greeting =
    new Date().getHours() < 12 ? 'Good morning'
    : new Date().getHours() < 18 ? 'Good afternoon'
    : 'Good evening';

  const role = summary?.role ?? 'LOAN_OFFICER';

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN:            'System Administrator',
    ACCOUNTING:             'Accounting',
    UNDERWRITER_COMPLIANCE: 'Underwriting & Compliance',
    INTERNAL_CONTROL:       'Internal Control',
    COLLECTIONS:            'Collections',
    LOAN_OFFICER:           'Loan Officer',
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Greeting */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {user?.firstName ?? 'there'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.jobTitle ?? roleLabel[role] ?? role} —{' '}
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Role-specific panel */}
      {summary && (
        <>
          {role === 'LOAN_OFFICER' && (
            <LoanOfficerPanel summary={summary} performance={performance} />
          )}
          {role === 'UNDERWRITER_COMPLIANCE' && (
            <CompliancePanel summary={summary} />
          )}
          {role === 'INTERNAL_CONTROL' && (
            <InternalControlPanel summary={summary} />
          )}
          {role === 'ACCOUNTING' && (
            <AccountingPanel summary={summary} />
          )}
          {role === 'COLLECTIONS' && (
            <CollectionsPanel summary={summary} />
          )}
          {role === 'SUPER_ADMIN' && (
            <AdminPanel summary={summary} hasPermission={hasPermission} />
          )}
        </>
      )}
    </div>
  );
}
