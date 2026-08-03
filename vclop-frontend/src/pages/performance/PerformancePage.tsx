import { useQuery } from '@tanstack/react-query';
import {
  Target, TrendingUp, Banknote, FileText, CheckCircle2, Wallet,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { performanceService } from '@/services/performance.service';
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

  if (isLoading) return <PageLoader />;

  const now = new Date();
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
          value={`₦${(perf?.monthlyTarget ?? 0).toLocaleString()}`}
          sub={perf?.monthlyTarget ? 'Set by your manager' : 'No target set yet'}
          icon={Target}
          color="bg-brand-50 text-brand-600"
        />
        <KpiCard
          title="Achieved (MTD)"
          value={`₦${(perf?.currentAchievement ?? 0).toLocaleString()}`}
          sub={`${perf?.monthlyDisbursements ?? 0} loan${perf?.monthlyDisbursements !== 1 ? 's' : ''} disbursed`}
          icon={Banknote}
          color="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          title="Remaining"
          value={`₦${(perf?.remainingTarget ?? 0).toLocaleString()}`}
          sub={(perf?.remainingTarget ?? 0) === 0 ? '🎉 Target reached!' : 'to hit your target'}
          icon={TrendingUp}
          color={(perf?.remainingTarget ?? 0) === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}
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

      {/* Monthly target progress bar */}
      {(perf?.monthlyTarget ?? 0) > 0 && (
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-800">Monthly Target Progress</h2>
          <ProgressBar
            label="Disbursed vs Target"
            value={perf!.currentAchievement}
            max={perf!.monthlyTarget}
            pct={perf!.progressPercentage}
            color={perf!.progressPercentage >= 100 ? 'bg-emerald-500' : perf!.progressPercentage >= 60 ? 'bg-brand-600' : 'bg-amber-500'}
          />

          {/* Weekly allowance bar */}
          {perf!.allowancePerMillion > 0 && (
            <ProgressBar
              label={`Week ${weekNo} Disbursements`}
              value={perf!.weeklyDisbursedAmount}
              max={perf!.monthlyTarget / 4}          // rough "weekly share" of monthly target
              pct={(perf!.weeklyDisbursedAmount / (perf!.monthlyTarget / 4)) * 100}
              color="bg-orange-500"
            />
          )}
        </div>
      )}

      {/* No target state */}
      {(perf?.monthlyTarget ?? 0) === 0 && (
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
