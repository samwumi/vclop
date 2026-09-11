import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, Building2, ClipboardList, FileCheck2, GitBranch, Landmark, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { dashboardService } from '@/services/dashboard.service';
import { performanceService } from '@/services/performance.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { StatCard } from './widgets/StatCard';
import { LoginActivityChart } from './widgets/LoginActivityChart';
import { UserStatusChart } from './widgets/UserStatusChart';
import { RecentAuditTable } from './widgets/RecentAuditTable';
import { SystemHealthWidget } from './widgets/SystemHealthWidget';

function OperationalCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: typeof ClipboardList; color: string }) {
  return <div className="card p-5 flex items-start gap-4"><div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}><Icon className="w-5 h-5" /></div><div><p className="text-sm font-medium text-gray-500">{title}</p><p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p></div></div>;
}

export function DashboardPage() {
  const { user, hasPermission } = useAuthStore();
  useQuery({ queryKey: ['dashboard', 'bootstrap'], queryFn: dashboardService.bootstrap, staleTime: 60_000 });
  const { data: summary } = useQuery({ queryKey: ['dashboard', 'operational-summary'], queryFn: dashboardService.operationalSummary, staleTime: 30_000 });
  const { data: performance } = useQuery({ queryKey: ['performance', 'me'], queryFn: performanceService.mine, staleTime: 60_000 });
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const roleLabel = summary?.role.replace(/_/g, ' ') ?? 'PLATFORM';

  return <div>
    <Breadcrumbs />
    <div className="page-header"><div><h1 className="page-title">{greeting}, {user?.firstName ?? 'there'}</h1><p className="text-sm text-gray-500 mt-0.5">{user?.jobTitle ?? roleLabel} — {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div></div>

    {summary && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <OperationalCard title="My Pending Tasks" value={summary.myTasks} icon={ClipboardList} color="bg-blue-50 text-blue-600" />
      <OperationalCard title={summary.role === 'UNDERWRITER_COMPLIANCE' ? 'Review Queue' : 'Applications'} value={summary.complianceQueue || summary.applications} icon={FileCheck2} color="bg-violet-50 text-violet-600" />
      <OperationalCard title="Approved for Disbursement" value={summary.approvedLoans} icon={Landmark} color="bg-emerald-50 text-emerald-600" />
      <OperationalCard title={summary.role === 'COLLECTIONS' ? 'Overdue Installments' : 'Open Collections'} value={summary.overdueInstallments || summary.collectionCases} icon={AlertTriangle} color="bg-amber-50 text-amber-600" />
    </div>}

    {performance && performance.monthlyTarget > 0 && <div className="card p-5 mb-6"><div className="flex items-center justify-between gap-4 mb-3"><div><p className="text-sm font-semibold text-gray-800">Monthly Target Progress</p><p className="text-xs text-gray-500">₦{performance.currentAchievement.toLocaleString()} achieved of ₦{performance.monthlyTarget.toLocaleString()}</p></div><p className="text-lg font-bold text-brand-700">{performance.progressPercentage.toFixed(0)}%</p></div><div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-brand-600 rounded-full" style={{ width: `${performance.progressPercentage}%` }} /></div><p className="text-xs text-gray-500 mt-2">₦{performance.remainingTarget.toLocaleString()} remaining</p></div>}

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {hasPermission('users:read') && <StatCard title="Total Users" queryKey={['dashboard', 'active-users']} queryFn={dashboardService.activeUsers} icon={Users} color="blue" />}
      {hasPermission('branches:read') && <StatCard title="Branches" queryKey={['dashboard', 'total-branches']} queryFn={dashboardService.totalBranches} icon={GitBranch} color="green" />}
      {hasPermission('departments:read') && <StatCard title="Departments" queryKey={['dashboard', 'total-departments']} queryFn={dashboardService.totalDepartments} icon={Building2} color="purple" />}
      {hasPermission('system:health') && <div className="card p-5 flex items-start gap-4"><div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center"><Activity className="w-5 h-5 text-emerald-600" /></div><div><p className="text-sm font-medium text-gray-500">Platform</p><p className="text-2xl font-bold text-gray-900 mt-0.5">Online</p></div></div>}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">{hasPermission('audit:read') && <LoginActivityChart />}{hasPermission('users:read') && <UserStatusChart />}</div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">{hasPermission('audit:read') && <RecentAuditTable />}{hasPermission('system:health') && <div className="lg:col-span-1 lg:row-start-1 lg:col-start-3"><SystemHealthWidget /></div>}</div>
  </div>;
}
