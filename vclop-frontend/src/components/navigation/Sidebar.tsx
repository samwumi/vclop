import { NavLink } from 'react-router-dom';
import { Building2 } from 'lucide-react';
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
        // Premium width and positioning
        'fixed top-0 left-0 z-50 h-full w-[280px] flex flex-col',
        // Premium glassmorphism background
        'bg-white/95 backdrop-blur-2xl border-r border-gray-200/60',
        // Premium shadow
        'shadow-2xl shadow-blue-900/5',
        'sidebar-transition',
        // Mobile: slide in/out. Desktop: always visible
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* Premium Logo Section with Gradient Background */}
      <div className="flex items-center gap-3 px-6 h-[72px] border-b border-gray-200/60 flex-shrink-0 bg-gradient-to-r from-blue-50/50 via-white/50 to-transparent relative overflow-hidden">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
        
        {/* Premium Logo with gradient */}
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/25 group-hover:shadow-xl group-hover:shadow-blue-700/30 transition-all duration-300">
          <Building2 className="w-5 h-5 text-white" />
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="min-w-0 relative z-10">
          <p className="text-base font-bold text-gray-900 leading-tight truncate tracking-tight">
            Vertical Capital
          </p>
          <p className="text-[10px] font-semibold text-gray-500 leading-tight truncate uppercase tracking-wider">
            Lending Platform
          </p>
        </div>
      </div>

      {/* Premium Navigation with enhanced styling */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
        {Object.entries(groups).map(([group, routes]) => (
          <div key={group} className="space-y-1">
            {/* Premium Section Header */}
            <div className="flex items-center gap-2 px-3 mb-3">
              <div className="w-1 h-3 bg-gradient-to-b from-blue-600 to-blue-700 rounded-full" />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500">
                {group}
              </p>
            </div>
            
            {/* Navigation Items */}
            {routes.map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold',
                    'transition-all duration-300 relative overflow-hidden',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25'
                      : 'text-gray-600 hover:bg-white/80 hover:text-gray-900 hover:shadow-md backdrop-blur-sm',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Animated background on hover */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                    
                    {/* Icon with premium styling */}
                    <div className={cn(
                      'relative z-10 p-1.5 rounded-lg transition-all duration-300',
                      isActive 
                        ? 'bg-white/20' 
                        : 'bg-gray-100 group-hover:bg-blue-100 group-hover:scale-110'
                    )}>
                      <route.icon className={cn(
                        'w-4 h-4 flex-shrink-0 transition-colors duration-300',
                        isActive ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
                      )} />
                    </div>
                    
                    {/* Label */}
                    <span className="truncate relative z-10 tracking-tight">{route.label}</span>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/40 rounded-l-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Premium Footer with gradient */}
      <div className="px-6 py-4 border-t border-gray-200/60 flex-shrink-0 bg-gradient-to-r from-gray-50/50 to-transparent relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-50/20 to-transparent" />
        
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            VCLOP v1.0.0
          </p>
          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50 animate-pulse" />
        </div>
      </div>
    </aside>
  );
}
