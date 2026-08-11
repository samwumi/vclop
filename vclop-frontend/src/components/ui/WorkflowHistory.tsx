/**
 * WorkflowHistory — shows the full stage-by-stage audit trail for a loan
 * application. Used on LoanDetailPage (officer), ComplianceReviewPanel,
 * and InternalControlPage so every role can see what happened and why.
 */
import { useQuery } from '@tanstack/react-query';
import { workflowsService } from '@/services/workflows.service';
import { formatDateTime } from '@/lib/utils';
import {
  CheckCircle2, XCircle, RotateCcw, AlertCircle, ChevronRight,
} from 'lucide-react';

interface TaskRecord {
  id: string;
  status: string;
  action: string | null;
  reason: string | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  stage: { name: string; code: string };
  completedBy?: { firstName: string; lastName: string } | null;
}

interface WorkflowInstance {
  currentStageCode: string;
  tasks: TaskRecord[];
}

const ACTION_ICON: Record<string, typeof CheckCircle2> = {
  APPROVE: CheckCircle2,
  REJECT:  XCircle,
  RETURN:  RotateCcw,
  REQUEST_INFORMATION: AlertCircle,
  ESCALATE: AlertCircle,
};

const ACTION_COLOR: Record<string, string> = {
  APPROVE: 'text-emerald-600',
  REJECT:  'text-red-600',
  RETURN:  'text-amber-600',
  REQUEST_INFORMATION: 'text-blue-600',
  ESCALATE: 'text-violet-600',
};

interface Props {
  applicationId: string;
  /** Highlight only the most recent return/rejection reason at the top */
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

  // Only completed tasks have meaningful feedback
  const completed = wf.tasks.filter((t) => t.status === 'COMPLETED' && t.action);

  if (completed.length === 0) return null;

  // Latest task with a RETURN or REJECT action — the feedback the current user needs
  const latestFeedback = [...completed]
    .reverse()
    .find((t) => t.action === 'RETURN' || t.action === 'REJECT' || t.action === 'REQUEST_INFORMATION');

  // Banner-only mode: just show the most recent feedback reason if any
  if (showBannerOnly) {
    if (!latestFeedback?.reason && !latestFeedback?.notes) return null;
    const Icon = ACTION_ICON[latestFeedback.action ?? ''] ?? AlertCircle;
    const color = ACTION_COLOR[latestFeedback.action ?? ''] ?? 'text-gray-600';
    const bgColor =
      latestFeedback.action === 'REJECT' ? 'bg-red-50 border-red-200' :
      latestFeedback.action === 'RETURN' ? 'bg-amber-50 border-amber-200' :
      'bg-blue-50 border-blue-200';
    return (
      <div className={`p-3 rounded-lg border ${bgColor} flex items-start gap-2`}>
        <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${color}`} />
        <div className="text-xs space-y-0.5">
          <p className={`font-semibold ${color}`}>
            {latestFeedback.action?.replace(/_/g, ' ')} by {latestFeedback.stage.name}
            {latestFeedback.completedAt && (
              <span className="font-normal text-gray-400 ml-2">{formatDateTime(latestFeedback.completedAt)}</span>
            )}
          </p>
          {latestFeedback.reason && <p className="text-gray-700">{latestFeedback.reason}</p>}
          {latestFeedback.notes  && <p className="text-gray-500 italic">{latestFeedback.notes}</p>}
        </div>
      </div>
    );
  }

  // Full history view
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Workflow History</p>
      <div className="relative">
        {/* vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100" />
        <div className="space-y-3">
          {completed.map((task) => {
            const Icon = ACTION_ICON[task.action ?? ''] ?? CheckCircle2;
            const color = ACTION_COLOR[task.action ?? ''] ?? 'text-gray-500';
            return (
              <div key={task.id} className="flex items-start gap-3 pl-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-white border-2 ${
                  task.action === 'APPROVE' ? 'border-emerald-400' :
                  task.action === 'REJECT'  ? 'border-red-400' :
                  task.action === 'RETURN'  ? 'border-amber-400' :
                  'border-blue-400'
                } z-10`}>
                  <Icon className={`w-2.5 h-2.5 ${color}`} />
                </div>
                <div className="flex-1 pb-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-700">{task.stage.name}</span>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span className={`text-xs font-medium ${color}`}>
                      {task.action?.replace(/_/g, ' ')}
                    </span>
                    {task.completedAt && (
                      <span className="text-xs text-gray-400 ml-auto">{formatDateTime(task.completedAt)}</span>
                    )}
                  </div>
                  {task.reason && (
                    <p className="text-xs text-gray-600 mt-0.5 ml-0.5">{task.reason}</p>
                  )}
                  {task.notes && (
                    <p className="text-xs text-gray-400 italic mt-0.5 ml-0.5">{task.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
