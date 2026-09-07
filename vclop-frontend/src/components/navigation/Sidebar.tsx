import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { APP_ROUTES, type RouteConfig } from '@/router/routes';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { hasPermission } = useAuthStore();

  const accessible = APP_ROUTES.filter((r) => {
    if (r.hidden) return false;
    if (!r.permission && !r.anyPermission) return true;
    if (r.anyPermission) return r.anyPermission.some((p) => hasPermission(p));
    return hasPermission(r.permission!);
  });

  const groups = accessible.reduce<Record<string, RouteConfig[]>>((acc, route) => {
    const g = route.group ?? 'Other';
    if (!acc[g]) acc[g] = [];
    acc[g].push(route);
    return acc;
  }, {});

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-50 h-full w-[280px] flex flex-col bg-white',
        'transition-transform duration-300 ease-out',
        'border-r',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
      style={{ borderColor: 'var(--border-light)' }}
    >
      {/* Monzo-style Logo Header */}
      <div className="flex items-center gap-3 px-6 h-[72px] border-b flex-shrink-0" style={{ borderColor: 'var(--border-light)' }}>
        <img src="/logo.svg" alt="Vertical Capital" className="w-10 h-10 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[17px] font-bold leading-tight truncate" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}>
            Vertical Capital
          </p>
          <p className="text-[11px] font-semibold leading-tight truncate uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Lending Platform
          </p>
        </div>
      </div>

      {/* Monzo-style Clean Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {Object.entries(groups).map(([group, routes]) => (
          <div key={group} className="space-y-0.5">
            {/* Monzo-style Section Header */}
            <div className="px-4 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {group}
              </p>
            </div>
            
            {/* Navigation Items - Monzo Style */}
            {routes.map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 px-4 py-3 text-[15px] font-semibold',
                    'transition-all duration-150 rounded-xl',
                    isActive
                      ? 'text-white'
                      : 'hover:bg-gray-50',
                  )
                }
                style={({ isActive }) => ({
                  background: isActive ? 'var(--brand-coral)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                })}
              >
                {({ isActive }) => (
                  <>
                    <route.icon 
                      className={cn(
                        'w-5 h-5 flex-shrink-0 transition-colors duration-150',
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                      )} 
                    />
                    <span className="truncate">{route.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Monzo-style Clean Footer */}
      <div className="px-6 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border-light)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            v1.0.0
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success-green)' }} />
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
