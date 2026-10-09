import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, TrendingUp, Users, Plus, Edit2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { officerTargetsService, type OfficerTarget } from '@/services/officer-targets.service';
import { useAuthStore } from '@/stores/auth.store';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { formatCurrency } from '@/lib/utils';

export function OfficerTargetsPage() {
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('users:manage');
  const qc = useQueryClient();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [showSetTargetModal, setShowSetTargetModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<OfficerTarget | null>(null);

  // Fetch targets for selected month
  const { data: targets, isLoading } = useQuery({
    queryKey: ['officer-targets', selectedMonth],
    queryFn: () => officerTargetsService.list({ month: selectedMonth }),
  });

  // Fetch dashboard summary
  const { data: summary } = useQuery({
    queryKey: ['officer-targets-summary'],
    queryFn: () => officerTargetsService.getDashboardSummary(),
  });

  const handleEdit = (target: OfficerTarget) => {
    setEditingTarget(target);
    setShowSetTargetModal(true);
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Officer Performance Targets</h1>
            <p className="text-sm text-gray-600 mt-1">Track monthly disbursement and customer acquisition targets</p>
          </div>
          {canManage && (
            <button
              onClick={() => {
                setEditingTarget(null);
                setShowSetTargetModal(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Set Target
            </button>
          )}
        </div>
      </div>

      {/* Month Selector */}
      <div className="mb-6 flex items-center gap-3">
        <Calendar className="w-5 h-5 text-gray-400" />
        <label className="text-sm font-medium text-gray-700">Target Month:</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="input w-48"
        />
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">Total Officers</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalOfficers}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">Disbursement Target</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalDisbursementTarget)}</p>
                </div>
                <Target className="w-10 h-10 text-emerald-500 opacity-20" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">Achieved</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalDisbursementAchieved)}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    {summary.totalDisbursementTarget > 0
                      ? `${((summary.totalDisbursementAchieved / summary.totalDisbursementTarget) * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-amber-500 opacity-20" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">Met Target</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {summary.officersMetDisbursementTarget} / {summary.totalOfficers}
                  </p>
                </div>
                <Target className="w-10 h-10 text-violet-500 opacity-20" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Targets Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Performance Overview</h2>
        </div>
        <div className="card-body p-0">
          {!targets || targets.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No targets set for {selectedMonth}</p>
              {canManage && (
                <button onClick={() => setShowSetTargetModal(true)} className="btn-primary mt-4">
                  Set Targets
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Officer</th>
                    <th>Branch</th>
                    <th className="text-right">Disbursement Target</th>
                    <th className="text-right">Achieved</th>
                    <th className="text-center">Rate</th>
                    <th className="text-right">Customer Target</th>
                    <th className="text-right">Achieved</th>
                    <th className="text-center">Rate</th>
                    {canManage && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {targets.map((target) => (
                    <tr key={target.id}>
                      <td>
                        <div>
                          <div className="font-medium text-gray-900">
                            {target.user.firstName} {target.user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{target.user.email}</div>
                        </div>
                      </td>
                      <td className="text-sm text-gray-600">{target.user.branch.name}</td>
                      <td className="text-right font-medium">{formatCurrency(target.disbursementTarget)}</td>
                      <td className="text-right font-medium text-emerald-600">
                        {formatCurrency(target.disbursementAchieved)}
                      </td>
                      <td className="text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            target.disbursementAchievementRate >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : target.disbursementAchievementRate >= 75
                                ? 'bg-blue-100 text-blue-800'
                                : target.disbursementAchievementRate >= 50
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {target.disbursementAchievementRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right font-medium">{target.customerTarget}</td>
                      <td className="text-right font-medium text-emerald-600">{target.customerAchieved}</td>
                      <td className="text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            target.customerAchievementRate >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : target.customerAchievementRate >= 75
                                ? 'bg-blue-100 text-blue-800'
                                : target.customerAchievementRate >= 50
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {target.customerAchievementRate.toFixed(1)}%
                        </span>
                      </td>
                      {canManage && (
                        <td>
                          <button
                            onClick={() => handleEdit(target)}
                            className="btn-ghost btn-icon w-8 h-8"
                            title="Edit target"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Set/Edit Target Modal */}
      {showSetTargetModal && (
        <SetTargetModal
          targetMonth={selectedMonth}
          editingTarget={editingTarget}
          onClose={() => {
            setShowSetTargetModal(false);
            setEditingTarget(null);
          }}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['officer-targets'] });
            qc.invalidateQueries({ queryKey: ['officer-targets-summary'] });
            setShowSetTargetModal(false);
            setEditingTarget(null);
          }}
        />
      )}
    </div>
  );
}

// Set Target Modal Component
function SetTargetModal({
  targetMonth,
  editingTarget,
  onClose,
  onSuccess,
}: {
  targetMonth: string;
  editingTarget: OfficerTarget | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [userId, setUserId] = useState(editingTarget?.userId || '');
  const [disbursementTarget, setDisbursementTarget] = useState(
    editingTarget?.disbursementTarget?.toString() || ''
  );
  const [customerTarget, setCustomerTarget] = useState(editingTarget?.customerTarget?.toString() || '');
  const [notes, setNotes] = useState(editingTarget?.notes || '');

  const mutation = useMutation({
    mutationFn: async () => {
      if (editingTarget) {
        return officerTargetsService.updateTarget(editingTarget.userId, targetMonth, {
          disbursementTarget: Number(disbursementTarget),
          customerTarget: Number(customerTarget),
          notes,
        });
      } else {
        return officerTargetsService.setTarget({
          userId,
          targetMonth,
          disbursementTarget: Number(disbursementTarget),
          customerTarget: Number(customerTarget),
          notes,
        });
      }
    },
    onSuccess: () => {
      toast.success(editingTarget ? 'Target updated' : 'Target set successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to set target');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingTarget ? 'Edit Target' : 'Set Target'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">For {targetMonth}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!editingTarget && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Officer</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter officer user ID"
                className="input w-full"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Get the user ID from the Users page</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disbursement Target (₦)</label>
            <input
              type="number"
              value={disbursementTarget}
              onChange={(e) => setDisbursementTarget(e.target.value)}
              placeholder="5000000"
              className="input w-full"
              required
              min="0"
              step="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Target</label>
            <input
              type="number"
              value={customerTarget}
              onChange={(e) => setCustomerTarget(e.target.value)}
              placeholder="20"
              className="input w-full"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Q4 high season target..."
              className="input w-full"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? 'Saving...' : editingTarget ? 'Update' : 'Set Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
