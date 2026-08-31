import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MapPin, X, Plus, Trash2 } from 'lucide-react';
import { usersService } from '@/services/users.service';
import { api } from '@/lib/axios';
import { formatDate } from '@/lib/utils';

interface Branch {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

interface LocationPermission {
  id: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  canViewLoans: boolean;
  grantedById?: string;
  grantedByName?: string;
  grantedAt: string;
  revokedAt?: string;
}

interface Props {
  userId: string;
  userName: string;
  onClose: () => void;
}

export function LocationPermissionsModal({ userId, userName, onClose }: Props) {
  const qc = useQueryClient();
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  // Fetch all branches
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['branches', 'locations'],
    queryFn: async () => {
      try {
        const res = await api.get('/branches/locations');
        const d = res.data?.data;
        return (Array.isArray(d) ? d : d?.data ?? []) as Branch[];
      } catch {
        return [];
      }
    },
  });

  // Fetch user's location permissions
  const { data: permissions = [], isLoading } = useQuery<LocationPermission[]>({
    queryKey: ['users', userId, 'location-permissions'],
    queryFn: async () => {
      const res = await usersService.getLocationPermissions(userId);
      return res;
    },
  });

  // Grant permission mutation
  const grantMutation = useMutation({
    mutationFn: async (branchIds: string[]) => {
      await usersService.grantLocationPermission(userId, branchIds);
    },
    onSuccess: () => {
      toast.success('Location permissions granted');
      qc.invalidateQueries({ queryKey: ['users', userId, 'location-permissions'] });
      setSelectedBranches([]);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to grant permissions');
    },
  });

  // Revoke permission mutation
  const revokeMutation = useMutation({
    mutationFn: async (branchId: string) => {
      await usersService.revokeLocationPermission(userId, branchId);
    },
    onSuccess: () => {
      toast.success('Location permission revoked');
      qc.invalidateQueries({ queryKey: ['users', userId, 'location-permissions'] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to revoke permission');
    },
  });

  // Get active permissions (not revoked)
  const activePermissions = permissions.filter((p) => p.canViewLoans && !p.revokedAt);

  // Get available branches (not already granted or revoked)
  const availableBranches = branches.filter(
    (b) => b.isActive && !permissions.some((p) => p.branchId === b.id && p.canViewLoans && !p.revokedAt)
  );

  const handleGrant = () => {
    if (selectedBranches.length === 0) {
      toast.error('Please select at least one branch');
      return;
    }
    grantMutation.mutate(selectedBranches);
  };

  const handleRevoke = (branchId: string) => {
    if (confirm('Revoke access to this location?')) {
      revokeMutation.mutate(branchId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-600" /> Location Permissions
            </h3>
            <p className="text-sm text-gray-500">{userName}</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn-icon">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Info banner */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-xs text-blue-700">
            💡 Grant this user access to view loan applications from specific branches. If no locations are assigned, the
            user can see all branches (admin access).
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading location permissions...</div>
          ) : (
            <div className="space-y-6">
              {/* Grant new permissions */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Grant Access to New Locations</h4>
                {availableBranches.length === 0 ? (
                  <p className="text-sm text-gray-500">All active branches have already been assigned.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-3 space-y-2">
                      {availableBranches.map((branch) => (
                        <label key={branch.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedBranches.includes(branch.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBranches([...selectedBranches, branch.id]);
                              } else {
                                setSelectedBranches(selectedBranches.filter((id) => id !== branch.id));
                              }
                            }}
                          />
                          <span className="font-medium">{branch.name}</span>
                          <span className="text-xs text-gray-400">({branch.code})</span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={handleGrant}
                      disabled={selectedBranches.length === 0 || grantMutation.isPending}
                      className="btn-primary btn-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {grantMutation.isPending
                        ? 'Granting...'
                        : `Grant Access (${selectedBranches.length})`}
                    </button>
                  </div>
                )}
              </div>

              {/* Active permissions */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Active Location Permissions ({activePermissions.length})
                </h4>
                {activePermissions.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
                    <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No location permissions granted</p>
                    <p className="text-xs text-gray-400 mt-1">
                      User can see all branches by default (admin access)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activePermissions.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{perm.branchName}</p>
                          <p className="text-xs text-gray-400">
                            {perm.branchCode} • Granted {formatDate(perm.grantedAt)}
                            {perm.grantedByName && ` by ${perm.grantedByName}`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRevoke(perm.branchId)}
                          disabled={revokeMutation.isPending}
                          className="btn-ghost btn-sm text-red-600 hover:bg-red-50 flex items-center gap-1 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Revoked permissions (history) */}
              {permissions.filter((p) => p.revokedAt).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Revoked Permissions (History)
                  </h4>
                  <div className="space-y-2">
                    {permissions
                      .filter((p) => p.revokedAt)
                      .map((perm) => (
                        <div
                          key={perm.id}
                          className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg opacity-60"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">{perm.branchName}</p>
                            <p className="text-xs text-gray-500">
                              {perm.branchCode} • Revoked {formatDate(perm.revokedAt!)}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                            REVOKED
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
