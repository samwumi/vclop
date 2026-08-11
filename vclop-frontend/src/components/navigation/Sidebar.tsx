import { NavLink } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
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
        // Always 260px wide, fixed on left
        'fixed top-0 left-0 z-50 h-full w-[260px] flex flex-col',
        'bg-white border-r border-gray-200',
        'transition-transform duration-200',
        // Mobile: slide in/out. Desktop: always visible
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-[60px] border-b border-gray-200 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight truncate">Vertical Capital</p>
          <p className="text-[10px] text-gray-400 leading-tight truncate">Lending & Operations</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {Object.entries(groups).map(([group, routes]) => (
          <div key={group} className="mb-4">
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              {group}
            </p>
            {routes.map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-0.5',
                    'transition-colors duration-100',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <route.icon className={cn('w-4 h-4 flex-shrink-0', isActive && 'text-brand-600')} />
                    <span className="truncate">{route.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Version */}
      <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
        <p className="text-[10px] text-gray-400">VCLOP v1.0.0</p>
      </div>
    </aside>
  );
}
