import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { dashboardService } from '@/services/dashboard.service';
import { PageLoader } from '@/components/ui/LoadingScreen';
import dayjs from 'dayjs';

export function LoginActivityChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'login-activity'],
    queryFn: () => dashboardService.loginActivity(7),
    staleTime: 60_000,
  });

  if (isLoading) return <PageLoader />;

  const formatted = (data ?? []).map((d) => ({
    ...d,
    date: dayjs(d.date).format('MMM D'),
  }));

  return (
    <div className="card p-5 col-span-2">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Login Activity — Last 7 Days</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="logins" stroke="#6366f1" strokeWidth={2} dot={false} name="Logins" />
          <Line type="monotone" dataKey="failures" stroke="#f87171" strokeWidth={2} dot={false} name="Failed" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
