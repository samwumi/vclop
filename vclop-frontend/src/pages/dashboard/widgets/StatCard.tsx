import { useQuery } from '@tanstack/react-query';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  queryKey: string[];
  queryFn: () => Promise<{ total: number; active?: number }>;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  description?: string;
}

const colorMap = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   text: 'text-blue-700' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  text: 'text-green-700' },
  yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', text: 'text-yellow-700' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-700' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-600',    text: 'text-red-700' },
};

export function StatCard({ title, queryKey, queryFn, icon: Icon, color = 'blue', description }: StatCardProps) {
  const { data, isLoading } = useQuery({ queryKey, queryFn, staleTime: 30_000 });
  const c = colorMap[color];

  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', c.bg)}>
        <Icon className={cn('w-5 h-5', c.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {isLoading ? (
          <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{data?.total ?? 0}</p>
        )}
        {description && !isLoading && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
        {data?.active !== undefined && !isLoading && (
          <p className="text-xs mt-0.5">
            <span className={cn('font-medium', c.text)}>{data.active} active</span>
            {data.total > 0 && (
              <span className="text-gray-400"> · {Math.round((data.active / data.total) * 100)}%</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
