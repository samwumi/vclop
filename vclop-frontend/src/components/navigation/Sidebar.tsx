import { NavLink } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { APP_ROUTES, type RouteConfig } from '@/router/routes';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, mobileOpen, onMobileClose }: SidebarProps) {
  const { hasPermission } = useAuthStore();

  // Filter routes user has access to
  const accessible = APP_ROUTES.filter((r) => {
    if (r.hidden) return false;
    if (!r.permission && !r.anyPermission) return true;
    if (r.anyPermission) return r.anyPermission.some((p) => hasPermission(p));
    return hasPermission(r.permission!);
  });

  // Group routes
  const groups = accessible.reduce<Record<string, RouteConfig[]>>((acc, route) => {
    const g = route.group ?? 'Other';
    if (!acc[g]) acc[g] = [];
    acc[g].push(route);
    return acc;
  }, {});

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-50 h-full flex flex-col bg-white border-r border-gray-200 sidebar-transition',
        // Desktop
        collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]',
        // Mobile
        'w-[260px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 border-b border-gray-200 flex-shrink-0',
        'h-[60px]',
      )}>
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-gray-900 tracking-tight truncate">VCLOP</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {Object.entries(groups).map(([group, routes]) => (
          <div key={group} className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {group}
              </p>
            )}
            {collapsed && <div className="w-6 h-px bg-gray-200 mx-auto mb-1" />}

            {routes.map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                onClick={onMobileClose}
                title={collapsed ? route.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                    'transition-colors duration-100 mb-0.5',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    collapsed && 'justify-center px-2',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <route.icon className={cn('w-4 h-4 flex-shrink-0', isActive && 'text-brand-600')} />
                    {!collapsed && <span className="truncate">{route.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Version */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
          <p className="text-[10px] text-gray-400">VCLOP v1.0.0 — Phase 1</p>
        </div>
      )}
    </aside>
  );
}
