import { ScrollText } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Not wired into Customer360Page's tab list — there is no backend support for
 * customer notes yet (no schema, no endpoints). Kept as an honest placeholder
 * rather than calling an API that doesn't exist.
 */
export function CustomerNotesTab() {
  return (
    <div className="card">
      <EmptyState
        icon={ScrollText}
        title="Notes coming soon"
        description="Customer notes aren't available yet — this feature hasn't been built on the backend."
      />
    </div>
  );
}
