import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

interface PublicRouteProps {
  children: React.ReactNode;
}

/** Redirects authenticated users away from auth pages */
export function PublicRoute({ children }: PublicRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
