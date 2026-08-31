import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { initials, fullName } from '@/lib/utils';

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, refreshToken, logout } = useAuthStore();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(refreshToken ?? ''),
    onSettled: () => {
      logout();
      navigate('/login');
    },
    onError: () => toast.error('Logout failed — session cleared locally'),
  });

  if (!user) return null;

  const name = fullName(user);
  const userInitials = initials(user.firstName, user.lastName);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {user.avatarPath ? (
            <img src={user.avatarPath} alt={name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            userInitials
          )}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-800 leading-tight max-w-[120px] truncate">{name}</p>
          <p className="text-xs text-gray-500 leading-tight max-w-[120px] truncate">{user.jobTitle ?? user.email}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
          {/* User info */}
          <div className="px-3 py-2.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          {user.mustChangePassword && (
            <div className="mx-2 mt-1.5 mb-1 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700 font-medium">⚠ Password change required</p>
            </div>
          )}

          <button
            onClick={() => { setOpen(false); navigate('/profile'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4 text-gray-400" />
            My Profile
          </button>
          <button
            onClick={() => { setOpen(false); navigate('/settings'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-400" />
            Settings
          </button>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); logoutMutation.mutate(); }}
              disabled={logoutMutation.isPending}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
