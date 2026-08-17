import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppRouter } from '@/router/AppRouter';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function App() {
  const { accessToken, setAuth, logout } = useAuthStore();

  // On mount, always fetch fresh user profile and permissions if we have a token
  // This ensures permissions are up-to-date even if admin changed them
  const { isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      console.log('[App] Fetching user profile and permissions...');
      const user = await authService.me();
      console.log('[App] Received user:', { 
        id: user.id, 
        email: user.email, 
        permissionCount: user.permissions.length,
        permissions: user.permissions 
      });
      // Tokens already in store — just update the user profile
      const store = useAuthStore.getState();
      setAuth(user, store.accessToken!, store.refreshToken!);
      console.log('[App] User permissions updated in store');
      return user;
    },
    enabled: !!accessToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Auto-logout on storage events from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'vclop-auth' && !e.newValue) {
        logout();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [logout]);

  if (isLoading) return <LoadingScreen />;

  return <AppRouter />;
}
