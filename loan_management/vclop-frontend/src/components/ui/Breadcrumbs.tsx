import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { APP_ROUTES } from '@/router/routes';

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs: { label: string; href: string }[] = [
    { label: 'Home', href: '/dashboard' },
  ];

  let accumulated = '';
  for (const seg of segments) {
    accumulated += `/${seg}`;
    const route = APP_ROUTES.find((r) => r.path === accumulated);
    if (route) crumbs.push({ label: route.label, href: accumulated });
    else if (!['auth'].includes(seg)) {
      crumbs.push({
        label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
        href: accumulated,
      });
    }
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
            {i === 0 ? (
              <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Home className="w-3.5 h-3.5" />
              </Link>
            ) : isLast ? (
              <span className="text-gray-800 font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.href} className="hover:text-brand-600 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
