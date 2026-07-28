import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardService } from '@/services/dashboard.service';
import { PageLoader } from '@/components/ui/LoadingScreen';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:               '#22c55e',
  INACTIVE:             '#9ca3af',
  PENDING_VERIFICATION: '#f59e0b',
  LOCKED:               '#ef4444',
  SUSPENDED:            '#8b5cf6',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:               'Active',
  INACTIVE:             'Inactive',
  PENDING_VERIFICATION: 'Pending',
  LOCKED:               'Locked',
  SUSPENDED:            'Suspended',
};

export function UserStatusChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'user-status'],
    queryFn: dashboardService.userStatusChart,
    staleTime: 60_000,
  });

  if (isLoading) return <PageLoader />;

  const chartData = (data ?? []).map((d) => ({
    name: STATUS_LABELS[d.status] ?? d.status,
    value: d._count.status,
    status: d.status,
  }));

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">User Status Distribution</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            formatter={(value: number) => [value, 'Users']}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
