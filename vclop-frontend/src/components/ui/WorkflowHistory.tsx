/**
 * WorkflowHistory — stage-by-stage audit trail for a loan application.
 * Used on LoanDetailPage (officer sees feedback), ComplianceReviewPanel
 * (compliance sees IC return reason), and InternalControlPage (IC sees all stages).
 */
import { useQuery } from '@tanstack/react-query';
import { workflowsService } from '@/services/workflows.service';
import { formatDateTime } from '@/lib/utils';
import { CheckCircle2, XCircle, RotateCcw, AlertCircle } from 'lucide-react';

interface TaskRecord {
  id: string;
  status: string;
  action: string | null;
  reason: string | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  stage: { name: string; code: string };
}

interface WorkflowInstance {
  currentStageCode: string;
  tasks: TaskRecord[];
}

const ACTION_META: Record<string, { icon: typeof CheckCircle2; color: string; ring: string; bg: string }> = {
  APPROVE:             { icon: CheckCircle2, color: 'text-emerald-600', ring: 'border-emerald-400', bg: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  REJECT:              { icon: XCircle,      color: 'text-red-600',     ring: 'border-red-400',     bg: 'bg-red-50 border-red-200 text-red-700' },
  RETURN:              { icon: RotateCcw,    color: 'text-amber-600',   ring: 'border-amber-400',   bg: 'bg-amber-50 border-amber-200 text-amber-800' },
  REQUEST_INFORMATION: { icon: AlertCircle,  color: 'text-blue-600',    ring: 'border-blue-400',    bg: 'bg-blue-50 border-blue-200 text-blue-800' },
  ESCALATE:            { icon: AlertCircle,  color: 'text-violet-600',  ring: 'border-violet-400',  bg: 'bg-violet-50 border-violet-200 text-violet-800' },
};
const DEFAULT_META = { icon: CheckCircle2, color: 'text-gray-500', ring: 'border-gray-300', bg: 'bg-gray-50 border-gray-200 text-gray-700' };

interface Props {
  applicationId: string;
  /** showBannerOnly: show only the latest return/reject reason as a compact banner */
  showBannerOnly?: boolean;
}

export function WorkflowHistory({ applicationId, showBannerOnly = false }: Props) {
  const { data: instance } = useQuery({
    queryKey: ['workflow-history', applicationId],
    queryFn: () => workflowsService.getInstance('LOAN_APPLICATION', applicationId),
    refetchInterval: 30_000,
  });

  const wf = instance as WorkflowInstance | null | undefined;
  if (!wf?.tasks?.length) return null;

  const completed = wf.tasks.filter((t) => t.status === 'COMPLETED' && t.action);
  if (completed.length === 0) return null;

  const latestFeedback = [...completed]
    .reverse()
    .find((t) => t.action === 'RETURN' || t.action === 'REJECT' || t.action === 'REQUEST_INFORMATION');

  // ── Banner-only mode ──────────────────────────────────────────────────────
  if (showBannerOnly) {
    if (!latestFeedback || (!latestFeedback.reason && !latestFeedback.notes)) return null;
    const meta = ACTION_META[latestFeedback.action ?? ''] ?? DEFAULT_META;
    const Icon = meta.icon;
    return (
      <div className={`p-3 rounded-lg border ${meta.bg} flex items-start gap-2`}>
        <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${meta.color}`} />
        <div className="space-y-0.5 text-xs">
          <p className="font-semibold">
            {latestFeedback.stage.name} — {latestFeedback.action?.replace(/_/g, ' ')}
            {latestFeedback.completedAt && (
              <span className="font-normal opacity-60 ml-2">{formatDateTime(latestFeedback.completedAt)}</span>
            )}
          </p>
          {latestFeedback.reason && <p>{latestFeedback.reason}</p>}
          {latestFeedback.notes  && <p className="opacity-70 italic">{latestFeedback.notes}</p>}
        </div>
      </div>
    );
  }

  // ── Full history timeline ────────────────────────────────────────────────
  return (
    <div>
      <p className="section-title mb-3">Workflow History</p>
      <div className="relative space-y-3">
        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-100" />
        {completed.map((task) => {
          const meta = ACTION_META[task.action ?? ''] ?? DEFAULT_META;
          const Icon = meta.icon;
          return (
            <div key={task.id} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-white border-2 ${meta.ring} z-10 mt-0.5`}>
                <Icon className={`w-2.5 h-2.5 ${meta.color}`} />
              </div>
              <div className="flex-1 pb-2 border-b border-gray-50 last:border-0">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-700">{task.stage.name}</span>
                  <span className={`text-xs font-medium ${meta.color}`}>
                    {task.action?.replace(/_/g, ' ')}
                  </span>
                  {task.completedAt && (
                    <span className="text-[10px] text-gray-400 ml-auto">{formatDateTime(task.completedAt)}</span>
                  )}
                </div>
                {task.reason && <p className="text-xs text-gray-600 mt-0.5">{task.reason}</p>}
                {task.notes  && <p className="text-xs text-gray-400 italic mt-0.5">{task.notes}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
