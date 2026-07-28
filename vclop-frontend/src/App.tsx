import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppRouter } from '@/router/AppRouter';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function App() {
  const { isAuthenticated, accessToken, setAuth, logout } = useAuthStore();

  // On mount, rehydrate user profile if we have a token stored
  const { isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await authService.me();
      // Tokens already in store — just update the user profile
      const store = useAuthStore.getState();
      setAuth(user, store.accessToken!, store.refreshToken!);
      return user;
    },
    enabled: !!accessToken && !isAuthenticated,
    retry: false,
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
