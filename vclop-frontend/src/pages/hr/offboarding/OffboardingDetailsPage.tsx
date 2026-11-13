import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, User } from 'lucide-react';
import { offboardingService, type OffboardingStatus } from '@/services/offboarding.service';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

const STATUS_CONFIG: Record<OffboardingStatus, { label: string; variant: 'gray' | 'yellow' | 'blue' | 'green' | 'red' }> = {
  INITIATED: { label: 'Initiated', variant: 'gray' },
  IT_ACCESS_REVOKED: { label: 'IT Revoked', variant: 'yellow' },
  FINANCE_CLEARED: { label: 'Finance Cleared', variant: 'yellow' },
  ASSETS_CLEARED: { label: 'Assets Cleared', variant: 'yellow' },
  HR_CLEARED: { label: 'HR Cleared', variant: 'blue' },
  COMPLETED: { label: 'Completed', variant: 'green' },
  ON_HOLD: { label: 'On Hold', variant: 'red' },
};

export function OffboardingDetailsPage() {
  const { offboardingId } = useParams<{ offboardingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const { data: offboarding, isLoading } = useQuery({
    queryKey: ['offboarding-details', offboardingId],
    queryFn: () => offboardingService.getOffboardingDetails(offboardingId!),
    enabled: !!offboardingId,
  });

  const revokeITMutation = useMutation({
    mutationFn: () => offboardingService.revokeITAccess(offboardingId!, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboarding-details', offboardingId] });
      alert('IT access revoked successfully');
      setShowModal(null);
      setFormData({});
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to revoke IT access');
    },
  });

  const financeMutation = useMutation({
    mutationFn: () => offboardingService.processFinanceClearance(offboardingId!, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboarding-details', offboardingId] });
      alert('Finance clearance processed');
      setShowModal(null);
      setFormData({});
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to process finance clearance');
    },
  });

  const assetMutation = useMutation({
    mutationFn: () => offboardingService.processAssetClearance(offboardingId!, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboarding-details', offboardingId] });
      alert('Asset clearance processed');
      setShowModal(null);
      setFormData({});
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to process asset clearance');
    },
  });

  const hrMutation = useMutation({
    mutationFn: () => offboardingService.processHRClearance(offboardingId!, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboarding-details', offboardingId] });
      alert('HR clearance processed - Offboarding complete!');
      setShowModal(null);
      setFormData({});
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to process HR clearance');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading offboarding details...</p>
        </div>
      </div>
    );
  }

  if (!offboarding) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-gray-600">Offboarding case not found</p>
          <button onClick={() => navigate('/hr/offboarding')} className="btn-primary mt-4">
            Back to Offboarding
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[offboarding.status];

  const clearanceActions = [
    {
      key: 'IT',
      label: 'Revoke IT Access',
      completed: !!offboarding.itAccessRevokedAt,
      canProcess: !offboarding.itAccessRevokedAt,
      onClick: () => setShowModal('IT'),
      permission: 'offboarding:it_clear',
    },
    {
      key: 'Finance',
      label: 'Process Finance Clearance',
      completed: !!offboarding.financeClearedAt,
      canProcess: !offboarding.financeClearedAt,
      onClick: () => setShowModal('Finance'),
      permission: 'offboarding:finance_clear',
    },
    {
      key: 'Assets',
      label: 'Process Asset Clearance',
      completed: !!offboarding.assetsClearedAt,
      canProcess: !offboarding.assetsClearedAt,
      onClick: () => setShowModal('Assets'),
      permission: 'offboarding:asset_clear',
    },
    {
      key: 'HR',
      label: 'Complete HR Clearance',
      completed: !!offboarding.hrClearedAt,
      canProcess: !offboarding.hrClearedAt && 
                  !!offboarding.financeClearedAt && 
                  !!offboarding.assetsClearedAt,
      onClick: () => setShowModal('HR'),
      permission: 'offboarding:hr_clear',
    },
  ];

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <button onClick={() => navigate('/hr/offboarding')} className="btn-ghost mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Offboarding
      </button>

      {/* Header */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-50 rounded-lg">
              <User className="w-8 h-8 text-brand-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {offboarding.user.firstName} {offboarding.user.lastName}
              </h1>
              <p className="text-gray-600">{offboarding.user.email}</p>
              {offboarding.user.phone && (
                <p className="text-gray-500 text-sm">{offboarding.user.phone}</p>
              )}
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        {/* Exit Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 mb-1">Exit Reason</p>
            <p className="font-semibold">{offboarding.exitReason.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Last Working Date</p>
            <p className="font-semibold">{formatDate(offboarding.lastWorkingDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Initiated By</p>
            <p className="font-semibold">
              {offboarding.initiatedBy.firstName} {offboarding.initiatedBy.lastName}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Initiated On</p>
            <p className="font-semibold">{formatDate(offboarding.initiatedAt)}</p>
          </div>
        </div>

        {offboarding.exitReasonDetails && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Details:</strong> {offboarding.exitReasonDetails}
            </p>
          </div>
        )}
      </div>

      {/* Clearance Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {clearanceActions.map((action) => (
          <div key={action.key} className="bg-white border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold">{action.label}</h3>
              {action.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            {action.completed ? (
              <span className="text-sm text-green-600">✓ Completed</span>
            ) : action.canProcess ? (
              <button
                onClick={action.onClick}
                className="btn-primary btn-sm w-full"
              >
                Process Clearance
              </button>
            ) : (
              <span className="text-sm text-gray-500">Prerequisites not met</span>
            )}
          </div>
        ))}
      </div>

      {/* Clearance Details */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Clearance Details</h2>
        <div className="space-y-6">
          {offboarding.itAccessRevokedAt && (
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">IT Access</h3>
              <p className="text-sm text-gray-600">Revoked on {formatDate(offboarding.itAccessRevokedAt)}</p>
              {offboarding.itAccessNotes && (
                <p className="text-sm text-gray-600 italic mt-1">"{offboarding.itAccessNotes}"</p>
              )}
            </div>
          )}

          {offboarding.financeClearedAt && (
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Finance</h3>
              <p className="text-sm text-gray-600">Cleared on {formatDate(offboarding.financeClearedAt)}</p>
              {offboarding.finalSettlementAmount !== null && (
                <div className="mt-2 space-y-1 text-sm">
                  <p>Outstanding Advances: ₦{offboarding.outstandingAdvances?.toLocaleString() || 0}</p>
                  <p>Outstanding Loans: ₦{offboarding.outstandingLoans?.toLocaleString() || 0}</p>
                  <p className="font-semibold">Final Settlement: ₦{offboarding.finalSettlementAmount?.toLocaleString() || 0}</p>
                </div>
              )}
              {offboarding.financeNotes && (
                <p className="text-sm text-gray-600 italic mt-2">"{offboarding.financeNotes}"</p>
              )}
            </div>
          )}

          {offboarding.assetsClearedAt && (
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Assets</h3>
              <p className="text-sm text-gray-600">Cleared on {formatDate(offboarding.assetsClearedAt)}</p>
              {offboarding.unreturned !== null && (
                <p className="text-sm mt-1">Unreturned Items: {offboarding.unreturned}</p>
              )}
              {offboarding.assetsNotes && (
                <p className="text-sm text-gray-600 italic mt-2">"{offboarding.assetsNotes}"</p>
              )}
            </div>
          )}

          {offboarding.hrClearedAt && (
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">HR Final Clearance</h3>
              <p className="text-sm text-gray-600">Cleared on {formatDate(offboarding.hrClearedAt)}</p>
              {offboarding.hrNotes && (
                <p className="text-sm text-gray-600 italic mt-1">"{offboarding.hrNotes}"</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals for processing clearances */}
      {showModal === 'IT' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Revoke IT Access</h3>
            <p className="text-gray-600 mb-4">
              This will immediately suspend the user's account and revoke all IT access.
            </p>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input min-h-[100px] mb-4"
              placeholder="Notes (optional)..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => revokeITMutation.mutate()}
                disabled={revokeITMutation.isPending}
                className="btn-danger flex-1"
              >
                {revokeITMutation.isPending ? 'Processing...' : 'Revoke Access'}
              </button>
              <button onClick={() => setShowModal(null)} className="btn-ghost flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'Finance' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Finance Clearance</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="label">Outstanding Advances (₦)</label>
                <input
                  type="number"
                  value={formData.outstandingAdvances || ''}
                  onChange={(e) => setFormData({ ...formData, outstandingAdvances: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">Outstanding Loans (₦)</label>
                <input
                  type="number"
                  value={formData.outstandingLoans || ''}
                  onChange={(e) => setFormData({ ...formData, outstandingLoans: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">Final Settlement Amount (₦)</label>
                <input
                  type="number"
                  value={formData.finalSettlementAmount || ''}
                  onChange={(e) => setFormData({ ...formData, finalSettlementAmount: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Notes (optional)..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => financeMutation.mutate()}
                disabled={financeMutation.isPending}
                className="btn-primary flex-1"
              >
                {financeMutation.isPending ? 'Processing...' : 'Process Clearance'}
              </button>
              <button onClick={() => { setShowModal(null); setFormData({}); }} className="btn-ghost flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'Assets' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Asset Clearance</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="label">Number of Unreturned Items</label>
                <input
                  type="number"
                  value={formData.unreturned || ''}
                  onChange={(e) => setFormData({ ...formData, unreturned: parseInt(e.target.value) || 0 })}
                  className="input"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Notes (optional)..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => assetMutation.mutate()}
                disabled={assetMutation.isPending}
                className="btn-primary flex-1"
              >
                {assetMutation.isPending ? 'Processing...' : 'Process Clearance'}
              </button>
              <button onClick={() => { setShowModal(null); setFormData({}); }} className="btn-ghost flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'HR' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">HR Final Clearance</h3>
            <p className="text-gray-600 mb-4">
              This will mark the offboarding as complete. All previous clearances must be processed first.
            </p>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input min-h-[100px] mb-4"
              placeholder="Final notes (optional)..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => hrMutation.mutate()}
                disabled={hrMutation.isPending}
                className="btn-primary flex-1"
              >
                {hrMutation.isPending ? 'Processing...' : 'Complete Offboarding'}
              </button>
              <button onClick={() => { setShowModal(null); setFormData({}); }} className="btn-ghost flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
