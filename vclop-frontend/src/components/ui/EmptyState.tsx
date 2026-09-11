import { type LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is nothing here yet.',
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state flex flex-col items-center justify-center py-12 md:py-16 px-4 text-center">
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 md:w-8 md:h-8 icon-premium-static" style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 className="text-responsive-sm font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-responsive-xs text-gray-500 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}
