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
        className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors duration-150"
        style={{ borderRadius: '12px' }}
      >
        {/* Monzo-style Avatar */}
        <div 
          className="w-9 h-9 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ 
            borderRadius: '50%',
            background: 'var(--brand-coral)'
          }}
        >
          {user.avatarPath ? (
            <img src={user.avatarPath} alt={name} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            userInitials
          )}
        </div>
        
        {/* User Info */}
        <div className="hidden sm:block text-left">
          <p className="text-[15px] font-semibold leading-tight max-w-[140px] truncate" style={{ color: 'var(--text-primary)' }}>
            {name}
          </p>
          <p className="text-[13px] leading-tight max-w-[140px] truncate" style={{ color: 'var(--text-secondary)' }}>
            {user.jobTitle ?? user.email}
          </p>
        </div>
        
        {/* Chevron */}
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} 
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {/* Monzo-style Dropdown */}
      {open && (
        <div 
          className="absolute right-0 top-full mt-2 w-72 bg-white py-2 z-50 animate-scale-in"
          style={{ 
            borderRadius: '16px',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {/* User Info Header */}
          <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
            <div className="flex items-center gap-3">
              {/* Large Avatar */}
              <div 
                className="w-12 h-12 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ 
                  borderRadius: '12px',
                  background: 'var(--brand-coral)'
                }}
              >
                {user.avatarPath ? (
                  <img src={user.avatarPath} alt={name} className="w-12 h-12 object-cover" style={{ borderRadius: '12px' }} />
                ) : (
                  userInitials
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{name}</p>
                <p className="text-[13px] truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                
                {/* Role Badge */}
                {user.jobTitle && (
                  <div className="badge badge-coral mt-1.5 inline-flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" />
                    {user.jobTitle}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Password Change Warning */}
          {user.mustChangePassword && (
            <div className="banner-warning mx-3 mt-2 mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <p className="text-[13px] font-semibold">Password change required</p>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="px-2 py-1">
            <button
              onClick={() => { setOpen(false); navigate('/profile'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-[15px] font-semibold hover:bg-gray-50 transition-colors duration-150"
              style={{ borderRadius: '12px', color: 'var(--text-secondary)' }}
            >
              <User className="w-5 h-5" />
              <span>My Profile</span>
            </button>
            
            <button
              onClick={() => { setOpen(false); navigate('/settings'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-[15px] font-semibold hover:bg-gray-50 transition-colors duration-150"
              style={{ borderRadius: '12px', color: 'var(--text-secondary)' }}
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </div>

          {/* Logout Section */}
          <div className="border-t mt-2 pt-2 px-2" style={{ borderColor: 'var(--border-light)' }}>
            <button
              onClick={() => { setOpen(false); logoutMutation.mutate(); }}
              disabled={logoutMutation.isPending}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-[15px] font-semibold hover:bg-red-50 transition-colors duration-150 disabled:opacity-50"
              style={{ borderRadius: '12px', color: 'var(--error-red)' }}
            >
              <LogOut className="w-5 h-5" />
              <span>
                {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
