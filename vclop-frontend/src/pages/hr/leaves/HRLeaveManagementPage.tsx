import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Calendar, Edit, History, TrendingUp, AlertCircle } from 'lucide-react';
import { leavesService } from '@/services/leaves.service';

interface Entitlement {
  id: string;
  user: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    branch: { name: string } | null;
  };
  leaveType: {
    id: string;
    code: string;
    name: string;
  };
  year: number;
  allocatedDays: string;
  carryForwardDays: string;
  adjustmentDays: string;
}

export function HRLeaveManagementPage() {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  // Default to current year (2026)
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    allocatedDays: '',
    carryForwardDays: '',
    adjustmentDays: '',
    reason: '',
  });

  const { data: entitlements, isLoading } = useQuery({
    queryKey: ['hr-entitlements', selectedYear],
    queryFn: () => leavesService.getAllEntitlements(selectedYear),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: any }) =>
      leavesService.updateEntitlement(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-entitlements'] });
      setEditingId(null);
      alert('Entitlement updated successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update entitlement');
    },
  });

  const adjustMutation = useMutation({
    mutationFn: (data: { id: string; adjustmentDays: number; reason: string }) =>
      leavesService.addAdjustment(data.id, data.adjustmentDays, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-entitlements'] });
      alert('Adjustment added successfully');
    },
  });

  const handleEdit = (entitlement: Entitlement) => {
    setEditingId(entitlement.id);
    setEditForm({
      allocatedDays: entitlement.allocatedDays,
      carryForwardDays: entitlement.carryForwardDays,
      adjustmentDays: entitlement.adjustmentDays,
      reason: '',
    });
  };

  const handleSave = () => {
    if (!editingId) return;

    updateMutation.mutate({
      id: editingId,
      updates: {
        allocatedDays: parseFloat(editForm.allocatedDays),
        carryForwardDays: parseFloat(editForm.carryForwardDays),
        adjustmentDays: parseFloat(editForm.adjustmentDays),
        reason: editForm.reason || 'Manual adjustment by HR',
      },
    });
  };

  const handleQuickAdjust = (id: string, adjustment: number) => {
    const reason = prompt(`Add ${adjustment > 0 ? '+' : ''}${adjustment} days. Enter reason:`);
    if (!reason) return;

    adjustMutation.mutate({ id, adjustmentDays: adjustment, reason });
  };

  const calculateTotal = (entitlement: Entitlement) => {
    return (
      parseFloat(entitlement.allocatedDays) +
      parseFloat(entitlement.carryForwardDays) +
      parseFloat(entitlement.adjustmentDays)
    );
  };

  // Group by user
  const groupedEntitlements = Array.isArray(entitlements) 
    ? entitlements.reduce((acc: any, item: Entitlement) => {
        const key = item.user.username;
        if (!acc[key]) {
          acc[key] = {
            user: item.user,
            entitlements: [],
          };
        }
        acc[key].entitlements.push(item);
        return acc;
      }, {})
    : {};

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leave Entitlements Management</h1>
              <p className="text-gray-600">View and adjust leave balances for all employees</p>
            </div>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {[2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold">{Object.keys(groupedEntitlements || {}).length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total Entitlements</p>
              <p className="text-2xl font-bold">{entitlements?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Year</p>
              <p className="text-2xl font-bold">{selectedYear}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Requires Attention</p>
              <p className="text-2xl font-bold">
                {Array.isArray(entitlements) ? entitlements.filter(e => calculateTotal(e) < 0).length : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Entitlements Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-gray-600">Loading entitlements...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedEntitlements || {}).map((group: any) => (
            <div key={group.user.username} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* User Header */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.user.firstName} {group.user.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      @{group.user.username} • {group.user.email}
                      {group.user.branch && ` • ${group.user.branch.name}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Entitlements Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Allocated</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Carry Forward</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Adjustment</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {group.entitlements.map((ent: Entitlement) => {
                      const total = calculateTotal(ent);
                      const isEditing = editingId === ent.id;

                      return (
                        <tr key={ent.id} className={total < 0 ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{ent.leaveType.name}</span>
                              <span className="text-xs text-gray-500">({ent.leaveType.code})</span>
                            </div>
                          </td>
                          
                          {isEditing ? (
                            <>
                              <td className="px-6 py-4 text-right">
                                <input
                                  type="number"
                                  value={editForm.allocatedDays}
                                  onChange={(e) => setEditForm({ ...editForm, allocatedDays: e.target.value })}
                                  className="w-20 px-2 py-1 border rounded text-right"
                                  step="0.5"
                                />
                              </td>
                              <td className="px-6 py-4 text-right">
                                <input
                                  type="number"
                                  value={editForm.carryForwardDays}
                                  onChange={(e) => setEditForm({ ...editForm, carryForwardDays: e.target.value })}
                                  className="w-20 px-2 py-1 border rounded text-right"
                                  step="0.5"
                                />
                              </td>
                              <td className="px-6 py-4 text-right">
                                <input
                                  type="number"
                                  value={editForm.adjustmentDays}
                                  onChange={(e) => setEditForm({ ...editForm, adjustmentDays: e.target.value })}
                                  className="w-20 px-2 py-1 border rounded text-right"
                                  step="0.5"
                                />
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="font-semibold text-gray-900">
                                  {(parseFloat(editForm.allocatedDays) + 
                                    parseFloat(editForm.carryForwardDays) + 
                                    parseFloat(editForm.adjustmentDays)).toFixed(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <input
                                    type="text"
                                    placeholder="Reason (optional)"
                                    value={editForm.reason}
                                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                                    className="w-32 px-2 py-1 border rounded text-sm"
                                  />
                                  <button
                                    onClick={handleSave}
                                    disabled={updateMutation.isPending}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 text-right text-gray-900">{ent.allocatedDays}</td>
                              <td className="px-6 py-4 text-right text-gray-900">{ent.carryForwardDays}</td>
                              <td className="px-6 py-4 text-right">
                                <span className={parseFloat(ent.adjustmentDays) >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {parseFloat(ent.adjustmentDays) > 0 && '+'}
                                  {ent.adjustmentDays}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={`font-semibold ${total < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                  {total.toFixed(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleEdit(ent)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleQuickAdjust(ent.id, 5)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded text-xs"
                                    title="Add 5 days"
                                  >
                                    +5
                                  </button>
                                  <button
                                    onClick={() => handleQuickAdjust(ent.id, -5)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded text-xs"
                                    title="Remove 5 days"
                                  >
                                    -5
                                  </button>
                                  <button
                                    className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                                    title="View history"
                                  >
                                    <History className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Quick Actions:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Click <strong>Edit</strong> to modify all values at once</li>
              <li>Click <strong>+5</strong> or <strong>-5</strong> for quick adjustments</li>
              <li>All changes are logged with reason and timestamp</li>
              <li>Negative balances are highlighted in red</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
