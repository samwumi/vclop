import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '@/types/auth.types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  logout: () => void;

  // Permission helpers — computed from user.permissions array
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (...codes: string[]) => boolean;
  hasAllPermissions: (...codes: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      updateUser: (partial) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...partial } });
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      hasPermission: (code: string) => {
        const user = get().user;
        if (!user) return false;
        return user.permissions.includes('system:admin') || user.permissions.includes(code);
      },

      hasAnyPermission: (...codes: string[]) => {
        const user = get().user;
        if (!user) return false;
        if (user.permissions.includes('system:admin')) return true;
        return codes.some((c) => user.permissions.includes(c));
      },

      hasAllPermissions: (...codes: string[]) => {
        const user = get().user;
        if (!user) return false;
        if (user.permissions.includes('system:admin')) return true;
        return codes.every((c) => user.permissions.includes(c));
      },
    }),
    {
      name: 'vclop-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist tokens — user profile reloaded from /auth/me on mount
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
