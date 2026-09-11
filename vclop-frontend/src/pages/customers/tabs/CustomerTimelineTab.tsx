import { formatDateTime } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { Clock } from 'lucide-react';
import type { CustomerTimelineEntry } from '@/types/domain.types';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-400',
  UPDATE: 'bg-blue-400',
  DELETE: 'bg-red-400',
};

/** Sourced from the audit log entries already returned alongside the profile by Customer 360 — no separate fetch. */
export function CustomerTimelineTab({ entries }: { entries: CustomerTimelineEntry[] }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-semibold text-gray-700">Activity Timeline</h3>
      </div>
      {!entries?.length ? (
        <div className="card-body">
          <EmptyState icon={Clock} title="No activity yet" description="Events will appear here as the customer record is updated." />
        </div>
      ) : (
        <div className="card-body">
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-100" />
            <div className="space-y-4">
              {entries.map((item) => (
                <div key={item.id} className="flex items-start gap-4 relative">
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center z-10 ${ACTION_COLORS[item.action] ?? 'bg-gray-300'}`}>
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-sm text-gray-800">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
