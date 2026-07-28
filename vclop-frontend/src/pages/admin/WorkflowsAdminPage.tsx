import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, GitMerge, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { useAuthStore } from '@/stores/auth.store';
import { workflowsService, type WorkflowAction, type WorkflowStageInput } from '@/services/workflows.service';

const ACTIONS: WorkflowAction[] = ['APPROVE', 'REJECT', 'RETURN', 'REQUEST_INFORMATION', 'ESCALATE', 'COMPLETE'];

const newStage = (sortOrder: number): WorkflowStageInput => ({
  code: sortOrder === 0 ? 'REVIEW' : `STAGE_${sortOrder + 1}`,
  name: sortOrder === 0 ? 'Review' : `Stage ${sortOrder + 1}`,
  sortOrder,
  isInitial: sortOrder === 0,
  allowedActions: sortOrder === 0 ? ['APPROVE', 'REJECT'] : ['COMPLETE'],
});

export function WorkflowsAdminPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', entityType: 'LOAN_APPLICATION', stages: [newStage(0), { ...newStage(1), code: 'COMPLETE', name: 'Complete', isTerminal: true }] });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['workflows', 'tasks', 'mine'],
    queryFn: workflowsService.myTasks,
  });

  const createMutation = useMutation({
    mutationFn: () => workflowsService.createDefinition({
      ...form,
      transitions: form.stages.slice(0, -1).map((stage, index) => ({
        fromStageCode: stage.code,
        toStageCode: form.stages[index + 1].code,
        action: 'APPROVE' as WorkflowAction,
      })),
    }),
    onSuccess: () => {
      toast.success('Workflow definition created');
      setShowForm(false);
      setForm({ code: '', name: '', entityType: 'LOAN_APPLICATION', stages: [newStage(0), { ...newStage(1), code: 'COMPLETE', name: 'Complete', isTerminal: true }] });
    },
    onError: (error: unknown) => toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create workflow'),
  });

  const claimMutation = useMutation({
    mutationFn: workflowsService.claimTask,
    onSuccess: () => { toast.success('Task claimed'); queryClient.invalidateQueries({ queryKey: ['workflows', 'tasks', 'mine'] }); },
    onError: () => toast.error('Unable to claim this task'),
  });

  const updateStage = (index: number, update: Partial<WorkflowStageInput>) => {
    setForm((current) => ({ ...current, stages: current.stages.map((stage, stageIndex) => stageIndex === index ? { ...stage, ...update } : stage) }));
  };

  const addStage = () => setForm((current) => ({ ...current, stages: [...current.stages.map((stage, index) => ({ ...stage, sortOrder: index, isTerminal: false })), { ...newStage(current.stages.length), code: 'COMPLETE', name: 'Complete', isTerminal: true }] }));

  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); createMutation.mutate(); };

  return (
    <div>
      <Breadcrumbs />
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><GitMerge className="w-5 h-5 text-gray-600" /> Workflows</h1>
          <p className="page-description">Create approval flows and claim work assigned to you.</p>
        </div>
        {hasPermission('settings:update') && <button className="btn-primary gap-2" onClick={() => setShowForm((value) => !value)}><Plus className="w-4 h-4" /> New Workflow</button>}
      </div>

      {showForm && (
        <div className="card mb-6"><div className="card-body">
          <form className="space-y-5" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className="form-label">Name</label><input required className="form-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></div>
              <div><label className="form-label">Code</label><input required className="form-input" placeholder="LOAN_APPROVAL" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} /></div>
              <div><label className="form-label">Entity Type</label><input required className="form-input" value={form.entityType} onChange={(event) => setForm((current) => ({ ...current, entityType: event.target.value.toUpperCase() }))} /></div>
            </div>
            <div className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold text-gray-800">Stages</h2><button type="button" className="btn-secondary btn-sm" onClick={addStage}><Plus className="w-3.5 h-3.5" /> Add stage</button></div>
              {form.stages.map((stage, index) => <div className="grid gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-5" key={`${stage.code}-${index}`}>
                <input className="form-input" value={stage.name} aria-label="Stage name" onChange={(event) => updateStage(index, { name: event.target.value })} />
                <input className="form-input" value={stage.code} aria-label="Stage code" onChange={(event) => updateStage(index, { code: event.target.value.toUpperCase() })} />
                <input className="form-input" placeholder="Permission (optional)" value={stage.requiredPermission ?? ''} onChange={(event) => updateStage(index, { requiredPermission: event.target.value || undefined })} />
                <select className="form-input" value={stage.allowedActions?.[0] ?? 'COMPLETE'} onChange={(event) => updateStage(index, { allowedActions: [event.target.value as WorkflowAction] })}>{ACTIONS.map((action) => <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>)}</select>
                <div className="flex items-center justify-between text-xs text-gray-500"><span>{stage.isInitial ? 'Initial' : stage.isTerminal ? 'Terminal' : `Stage ${index + 1}`}</span>{form.stages.length > 2 && !stage.isInitial && !stage.isTerminal && <button type="button" className="btn-ghost btn-icon" onClick={() => setForm((current) => ({ ...current, stages: current.stages.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex, all) => ({ ...item, sortOrder: itemIndex, isTerminal: itemIndex === all.length - 1 })) }))}><X className="w-4 h-4 text-red-500" /></button>}</div>
              </div>)}</div>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4"><button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" disabled={createMutation.isPending} className="btn-primary disabled:opacity-50">{createMutation.isPending ? 'Creating…' : 'Create Workflow'}</button></div>
          </form>
        </div></div>
      )}

      <h2 className="mb-3 text-base font-semibold text-gray-800">My workflow tasks</h2>
      {isLoading ? <PageLoader /> : !tasks.length ? <div className="card"><EmptyState icon={CheckCircle2} title="No assigned tasks" description="Tasks that require your action appear here." /></div> : <div className="table-container"><table className="table"><thead><tr><th>Workflow</th><th>Stage</th><th>Due</th><th>Status</th><th /></tr></thead><tbody>{tasks.map((task) => <tr key={task.id}><td><p className="font-medium text-gray-800">{task.workflowInstance.entityType.replace(/_/g, ' ')}</p><p className="text-xs text-gray-400 font-mono">{task.workflowInstance.entityId}</p></td><td>{task.stage.name}</td><td className="text-xs text-gray-500">{task.dueAt ? new Date(task.dueAt).toLocaleString() : '—'}</td><td><Badge variant={task.status === 'IN_PROGRESS' ? 'blue' : 'yellow'}>{task.status.replace(/_/g, ' ')}</Badge></td><td>{task.status === 'PENDING' && <button className="btn-secondary btn-sm" disabled={claimMutation.isPending} onClick={() => claimMutation.mutate(task.id)}>Claim</button>}</td></tr>)}</tbody></table></div>}
    </div>
  );
}
