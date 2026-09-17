import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { transportService } from '@/services/transport.service';

interface CreateTransportRequestPanelProps {
  onClose: () => void;
}

export function CreateTransportRequestPanel({ onClose }: CreateTransportRequestPanelProps) {
  const [purpose, setPurpose] = useState('');
  const [location, setLocation] = useState('');
  const [customerCount, setCustomerCount] = useState('1');
  const [distanceKm, setDistanceKm] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [suggestedAmount, setSuggestedAmount] = useState('');
  
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () =>
      transportService.create({
        purpose,
        location,
        customerCount: customerCount ? Number(customerCount) : 1,
        distanceKm: distanceKm ? Number(distanceKm) : undefined,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        suggestedAmount: suggestedAmount ? Number(suggestedAmount) : undefined,
      }),
    onSuccess: () => {
      toast.success('Transport request created successfully');
      qc.invalidateQueries({ queryKey: ['transport-requests'] });
      onClose();
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create transport request'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim() || !location.trim()) {
      toast.error('Please fill in purpose and location');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="panel-overlay">
      <div className="panel-backdrop" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-white h-full shadow-2xl flex flex-col">
        <div className="panel-header flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Create Transport Request</h2>
          <button onClick={onClose} className="btn-ghost btn-icon w-8 h-8 text-gray-400">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            <div>
              <label className="form-label">Purpose <span className="text-red-500">*</span></label>
              <textarea
                className="form-input"
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe the purpose of this transport request..."
                required
              />
            </div>

            <div>
              <label className="form-label">Location <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter destination or route"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Number of Customers</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={customerCount}
                  onChange={(e) => setCustomerCount(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="form-input"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Estimated Cost (₦)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="form-label">Suggested Amount (₦)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={suggestedAmount}
                  onChange={(e) => setSuggestedAmount(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <strong>Note:</strong> Transport requests are standalone and will go through the standard approval workflow.
            </div>
          </div>

          <div className="panel-footer">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || !purpose.trim() || !location.trim()}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating…' : 'Create Request'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
