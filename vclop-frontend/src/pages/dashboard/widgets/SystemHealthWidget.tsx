import { useQuery } from '@tanstack/react-query';
import { Activity, Database, Cpu, HardDrive } from 'lucide-react';
import { dashboardService } from '@/services/dashboard.service';
import { cn } from '@/lib/utils';

interface HealthData {
  status: string;
  database: { status: string; latencyMs: number };
  memory: { heapUsedMb: number; heapTotalMb: number; rssMb: number };
  uptime: number;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function SystemHealthWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'health'],
    queryFn: dashboardService.systemHealth,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const health = data as HealthData | undefined;
  const isHealthy = health?.status === 'healthy';

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">System Health</h3>
        {!isLoading && (
          <span className={cn(
            'badge text-xs',
            isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700',
          )}>
            {isHealthy ? '● Healthy' : '● Degraded'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : health ? (
        <div className="space-y-3">
          <HealthRow
            icon={Database}
            label="Database"
            value={health.database.status}
            sub={`${health.database.latencyMs}ms latency`}
            ok={health.database.status === 'connected'}
          />
          <HealthRow
            icon={Cpu}
            label="Memory"
            value={`${health.memory.heapUsedMb} MB`}
            sub={`of ${health.memory.heapTotalMb} MB heap`}
            ok={health.memory.heapUsedMb < health.memory.heapTotalMb * 0.85}
          />
          <HealthRow
            icon={HardDrive}
            label="RSS"
            value={`${health.memory.rssMb} MB`}
            sub="resident set size"
            ok
          />
          <HealthRow
            icon={Activity}
            label="Uptime"
            value={formatUptime(health.uptime)}
            sub="since last restart"
            ok
          />
        </div>
      ) : null}
    </div>
  );
}

function HealthRow({
  icon: Icon, label, value, sub, ok,
}: { icon: typeof Activity; label: string; value: string; sub: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
        ok ? 'bg-green-50' : 'bg-red-50',
      )}>
        <Icon className={cn('w-3.5 h-3.5', ok ? 'text-green-600' : 'text-red-500')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">{label}</span>
          <span className="text-xs font-semibold text-gray-800">{value}</span>
        </div>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  );
}
