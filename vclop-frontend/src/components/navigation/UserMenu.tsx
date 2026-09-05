import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, ChevronDown, Shield, Briefcase } from 'lucide-react';
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
        className="group flex items-center gap-3 px-3 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/60 hover:bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-300"
      >
        {/* Premium Avatar with gradient ring */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-md" />
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg shadow-blue-600/25 ring-2 ring-white/50">
            {user.avatarPath ? (
              <img src={user.avatarPath} alt={name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              userInitials
            )}
          </div>
        </div>
        
        {/* User Info */}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-bold text-gray-900 leading-tight max-w-[140px] truncate tracking-tight">
            {name}
          </p>
          <p className="text-xs font-medium text-gray-500 leading-tight max-w-[140px] truncate">
            {user.jobTitle ?? user.email}
          </p>
        </div>
        
        {/* Premium Chevron */}
        <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Premium Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-blue-900/10 border border-gray-200/60 py-2 z-50 animate-scale-in">
          {/* Premium User Info Header with Gradient */}
          <div className="px-4 py-4 border-b border-gray-200/60 bg-gradient-to-r from-blue-50/50 to-transparent relative overflow-hidden">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-transparent" />
            
            <div className="relative z-10 flex items-center gap-3">
              {/* Large Avatar */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg shadow-blue-600/25">
                {user.avatarPath ? (
                  <img src={user.avatarPath} alt={name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  userInitials
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                
                {/* Role Badge */}
                {user.jobTitle && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
                    <Briefcase className="w-3 h-3" />
                    {user.jobTitle}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Password Change Warning */}
          {user.mustChangePassword && (
            <div className="mx-3 mt-2 mb-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/60 shadow-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600" />
                <p className="text-xs text-amber-800 font-semibold">Password change required</p>
              </div>
            </div>
          )}

          {/* Premium Menu Items */}
          <div className="px-2 py-1">
            <button
              onClick={() => { setOpen(false); navigate('/profile'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent hover:text-gray-900 transition-all duration-200 group"
            >
              <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-200">
                <User className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
              </div>
              <span className="tracking-tight">My Profile</span>
            </button>
            
            <button
              onClick={() => { setOpen(false); navigate('/settings'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent hover:text-gray-900 transition-all duration-200 group"
            >
              <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-200">
                <Settings className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
              </div>
              <span className="tracking-tight">Settings</span>
            </button>
          </div>

          {/* Premium Logout Section */}
          <div className="border-t border-gray-200/60 mt-2 pt-2 px-2">
            <button
              onClick={() => { setOpen(false); logoutMutation.mutate(); }}
              disabled={logoutMutation.isPending}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-transparent hover:text-red-700 transition-all duration-200 group disabled:opacity-50"
            >
              <div className="p-1.5 rounded-lg bg-red-100 group-hover:bg-red-200 group-hover:scale-110 transition-all duration-200">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <span className="tracking-tight">
                {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
