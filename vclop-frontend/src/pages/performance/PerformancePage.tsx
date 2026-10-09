import { useQuery } from '@tanstack/react-query';
import {
  Target, TrendingUp, Banknote, FileText, CheckCircle2, Wallet, Users,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { performanceService } from '@/services/performance.service';
import { officerTargetsService } from '@/services/officer-targets.service';
import { useAuthStore } from '@/stores/auth.store';

// ── Stat card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: typeof Target;
  color: string;
}

function KpiCard({ title, value, sub, icon: Icon, color }: KpiCardProps) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
        <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  pct: number;
  color?: string;
}

function ProgressBar({ label, value, max, pct, color = 'bg-brand-600' }: ProgressBarProps) {
  const safeP = Math.min(100, Math.max(0, pct));
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-sm font-bold text-gray-900">{safeP.toFixed(0)}%</p>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${safeP}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>₦{value.toLocaleString()}</span>
        <span>₦{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function PerformancePage() {
  const { user } = useAuthStore();

  const { data: perf, isLoading } = useQuery({
    queryKey: ['performance', 'me'],
    queryFn: performanceService.mine,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  // Get current date for month calculations
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Fetch officer targets for current month
  const { data: myTarget } = useQuery({
    queryKey: ['officer-target', 'me', currentMonth],
    queryFn: async () => {
      if (!user?.id) return null;
      return officerTargetsService.getOne(user.id, currentMonth);
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  if (isLoading) return <PageLoader />;

  const monthName = now.toLocaleString('en-NG', { month: 'long', year: 'numeric' });

  // Which week of the month (1–5)
  const weekNo = Math.ceil(now.getDate() / 7);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Page title */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-600" /> My Performance
          </h1>
          <p className="page-description">
            {user?.firstName} {user?.lastName} — {monthName}
          </p>
        </div>
      </div>

      {/* KPI grid — 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Monthly Target"
          value={`₦${(myTarget?.disbursementTarget ?? perf?.monthlyTarget ?? 0).toLocaleString()}`}
          sub={myTarget || perf?.monthlyTarget ? 'Set by your manager' : 'No target set yet'}
          icon={Target}
          color="bg-brand-50 text-brand-600"
        />
        <KpiCard
          title="Achieved (MTD)"
          value={`₦${(myTarget?.disbursementAchieved ?? perf?.currentAchievement ?? 0).toLocaleString()}`}
          sub={`${perf?.monthlyDisbursements ?? 0} loan${perf?.monthlyDisbursements !== 1 ? 's' : ''} disbursed`}
          icon={Banknote}
          color="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          title="Remaining"
          value={`₦${(myTarget ? Number(myTarget.disbursementTarget) - Number(myTarget.disbursementAchieved) : perf?.remainingTarget ?? 0).toLocaleString()}`}
          sub={(myTarget ? Number(myTarget.disbursementTarget) - Number(myTarget.disbursementAchieved) : perf?.remainingTarget ?? 0) <= 0 ? '🎉 Target reached!' : 'to hit your target'}
          icon={TrendingUp}
          color={(myTarget ? Number(myTarget.disbursementTarget) - Number(myTarget.disbursementAchieved) : perf?.remainingTarget ?? 0) <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}
        />
        <KpiCard
          title="Applications (MTD)"
          value={String(perf?.monthlyApplications ?? 0)}
          sub="Total submitted this month"
          icon={FileText}
          color="bg-violet-50 text-violet-600"
        />
        <KpiCard
          title="Approval Rate"
          value={`${perf?.approvalPercentage ?? 0}%`}
          sub="Disbursed vs reviewed"
          icon={CheckCircle2}
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          title={`Week ${weekNo} Allowance`}
          value={`₦${(perf?.weeklyAllowance ?? 0).toLocaleString()}`}
          sub={
            perf?.allowancePerMillion
              ? `₦${perf.allowancePerMillion.toLocaleString()} per ₦1M disbursed`
              : 'Allowance formula not configured'
          }
          icon={Wallet}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* New Officer Targets Section */}
      {myTarget && (
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Officer Targets ({monthName})
          </h2>
          
          {/* Progress Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Disbursement Progress */}
            <div className="space-y-2">
              <ProgressBar
                label="Disbursement Target"
                value={Number(myTarget.disbursementAchieved)}
                max={Number(myTarget.disbursementTarget)}
                pct={myTarget.disbursementAchievementRate}
                color={
                  myTarget.disbursementAchievementRate >= 100
                    ? 'bg-emerald-500'
                    : myTarget.disbursementAchievementRate >= 75
                      ? 'bg-blue-500'
                      : myTarget.disbursementAchievementRate >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                }
              />
            </div>

            {/* Customer Acquisition Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Customer Target
                </p>
                <p className="text-sm font-bold text-gray-900">{myTarget.customerAchievementRate.toFixed(0)}%</p>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    myTarget.customerAchievementRate >= 100
                      ? 'bg-emerald-500'
                      : myTarget.customerAchievementRate >= 75
                        ? 'bg-blue-500'
                        : myTarget.customerAchievementRate >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, myTarget.customerAchievementRate)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-400">
                <span>{myTarget.customerAchieved} customers</span>
                <span>{myTarget.customerTarget} target</span>
              </div>
            </div>
          </div>

          {/* Detailed Target Table */}
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="table">
              <thead>
                <tr>
                  <th>Officer</th>
                  <th>Branch</th>
                  <th className="text-right">Disbursement Target</th>
                  <th className="text-right">Achieved</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">Customer Target</th>
                  <th className="text-right">Achieved</th>
                  <th className="text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </span>
                      <span className="text-xs text-gray-500">{user?.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {myTarget.user?.branch?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="text-right font-medium">
                    ₦{Number(myTarget.disbursementTarget).toLocaleString()}
                  </td>
                  <td className="text-right">
                    ₦{Number(myTarget.disbursementAchieved).toLocaleString()}
                  </td>
                  <td className="text-right">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        myTarget.disbursementAchievementRate >= 100
                          ? 'bg-emerald-100 text-emerald-700'
                          : myTarget.disbursementAchievementRate >= 75
                            ? 'bg-blue-100 text-blue-700'
                            : myTarget.disbursementAchievementRate >= 50
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {myTarget.disbursementAchievementRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right font-medium">{myTarget.customerTarget}</td>
                  <td className="text-right">{myTarget.customerAchieved}</td>
                  <td className="text-right">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        myTarget.customerAchievementRate >= 100
                          ? 'bg-emerald-100 text-emerald-700'
                          : myTarget.customerAchievementRate >= 75
                            ? 'bg-blue-100 text-blue-700'
                            : myTarget.customerAchievementRate >= 50
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {myTarget.customerAchievementRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {myTarget.notes && (
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              <strong>Note:</strong> {myTarget.notes}
            </div>
          )}
        </div>
      )}

      {/* Monthly target progress bar */}
      {((myTarget?.disbursementTarget ?? perf?.monthlyTarget ?? 0) > 0) && (
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-800">Monthly Target Progress</h2>
          <ProgressBar
            label="Disbursed vs Target"
            value={myTarget ? Number(myTarget.disbursementAchieved) : perf!.currentAchievement}
            max={myTarget ? Number(myTarget.disbursementTarget) : perf!.monthlyTarget}
            pct={myTarget ? myTarget.disbursementAchievementRate : perf!.progressPercentage}
            color={
              (myTarget ? myTarget.disbursementAchievementRate : perf!.progressPercentage) >= 100
                ? 'bg-emerald-500'
                : (myTarget ? myTarget.disbursementAchievementRate : perf!.progressPercentage) >= 60
                  ? 'bg-brand-600'
                  : 'bg-amber-500'
            }
          />

          {/* Weekly allowance bar */}
          {(perf?.allowancePerMillion ?? 0) > 0 && (
            <ProgressBar
              label={`Week ${weekNo} Disbursements`}
              value={perf!.weeklyDisbursedAmount}
              max={(myTarget ? Number(myTarget.disbursementTarget) : perf!.monthlyTarget) / 4}
              pct={(perf!.weeklyDisbursedAmount / ((myTarget ? Number(myTarget.disbursementTarget) : perf!.monthlyTarget) / 4)) * 100}
              color="bg-orange-500"
            />
          )}
        </div>
      )}

      {/* No target state */}
      {((myTarget?.disbursementTarget ?? perf?.monthlyTarget ?? 0) === 0) && (
        <div className="card p-8 text-center">
          <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-700">No target set</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            Your manager hasn't configured a monthly target for you yet.
            Contact your supervisor or system admin.
          </p>
        </div>
      )}

      {/* Weekly allowance explanation */}
      {(perf?.allowancePerMillion ?? 0) > 0 && (
        <div className="card p-4 bg-orange-50 border border-orange-100">
          <p className="text-xs text-orange-700">
            <strong>Weekly Allowance Formula:</strong>{' '}
            ₦{(perf!.allowancePerMillion).toLocaleString()} for every ₦1,000,000 disbursed in the current week.
            This week you disbursed ₦{(perf!.weeklyDisbursedAmount).toLocaleString()},
            earning <strong>₦{(perf!.weeklyAllowance).toLocaleString()}</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
