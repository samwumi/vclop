import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { User, Lock, Save } from 'lucide-react';
import { api } from '@/lib/axios';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useAuthStore } from '@/stores/auth.store';
import type { ApiResponse } from '@/types/api.types';
import type { AuthUser } from '@/types/auth.types';

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();

  // ── Profile form ─────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    firstName:  user?.firstName  ?? '',
    lastName:   user?.lastName   ?? '',
    jobTitle:   user?.jobTitle   ?? '',
    phone:      (user as (AuthUser & { phone?: string }) | null)?.phone ?? '',
  });

  // ── Password form ────────────────────────────────────────────────────────
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({});

  const profileMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<ApiResponse<AuthUser>>('/users/me', {
        firstName: profile.firstName,
        lastName:  profile.lastName,
        jobTitle:  profile.jobTitle || undefined,
      });
      return data.data!;
    },
    onSuccess: (updated) => {
      updateUser({ firstName: updated.firstName, lastName: updated.lastName, jobTitle: updated.jobTitle });
      toast.success('Profile updated');
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/auth/change-password', {
        currentPassword: pwd.current,
        newPassword: pwd.next,
      });
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPwd({ current: '', next: '', confirm: '' });
      updateUser({ mustChangePassword: false });
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Password change failed'),
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!pwd.current) errs.current = 'Current password is required';
    if (!pwd.next || pwd.next.length < 8) errs.next = 'New password must be at least 8 characters';
    if (pwd.next !== pwd.confirm) errs.confirm = 'Passwords do not match';
    setPwdErrors(errs);
    if (Object.keys(errs).length) return;
    passwordMutation.mutate();
  };

  if (!user) return null;

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Breadcrumbs />
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <User className="w-5 h-5 text-gray-600" /> My Profile
        </h1>
      </div>

      {user.mustChangePassword && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          ⚠ You are required to change your password before using the system.
        </div>
      )}

      {/* Avatar + identity */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {user.avatarPath
            ? <img src={user.avatarPath} alt={user.firstName} className="w-16 h-16 rounded-full object-cover" />
            : initials}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-gray-500">{user.jobTitle ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
          {(user as AuthUser & { branchName?: string | null }).branchName && (
            <p className="text-xs text-brand-600 mt-0.5">
              📍 {(user as AuthUser & { branchName?: string | null }).branchName}
            </p>
          )}
          {(user as AuthUser & { departmentName?: string | null }).departmentName && (
            <p className="text-xs text-gray-400">
              {(user as AuthUser & { departmentName?: string | null }).departmentName}
            </p>
          )}
        </div>
      </div>

      {/* Edit profile */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Edit Profile</h2>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name</label>
              <input
                className="form-input"
                value={profile.firstName}
                onChange={(e) => setProfile(p => ({ ...p, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input
                className="form-input"
                value={profile.lastName}
                onChange={(e) => setProfile(p => ({ ...p, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="form-label">Job Title</label>
            <input
              className="form-input"
              value={profile.jobTitle}
              onChange={(e) => setProfile(p => ({ ...p, jobTitle: e.target.value }))}
              placeholder="Your role or job title"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => profileMutation.mutate()}
              disabled={profileMutation.isPending}
              className="btn-primary gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {profileMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="card-body space-y-4">
          <div>
            <label className="form-label">Current Password <span className="text-red-500">*</span></label>
            <input
              type="password"
              className="form-input"
              value={pwd.current}
              onChange={(e) => setPwd(p => ({ ...p, current: e.target.value }))}
              autoComplete="current-password"
            />
            {pwdErrors.current && <p className="text-xs text-red-500 mt-0.5">{pwdErrors.current}</p>}
          </div>
          <div>
            <label className="form-label">New Password <span className="text-red-500">*</span></label>
            <input
              type="password"
              className="form-input"
              value={pwd.next}
              onChange={(e) => setPwd(p => ({ ...p, next: e.target.value }))}
              autoComplete="new-password"
            />
            {pwdErrors.next && <p className="text-xs text-red-500 mt-0.5">{pwdErrors.next}</p>}
            <p className="text-xs text-gray-400 mt-1">Min 8 characters, include uppercase, number, and symbol.</p>
          </div>
          <div>
            <label className="form-label">Confirm New Password <span className="text-red-500">*</span></label>
            <input
              type="password"
              className="form-input"
              value={pwd.confirm}
              onChange={(e) => setPwd(p => ({ ...p, confirm: e.target.value }))}
              autoComplete="new-password"
            />
            {pwdErrors.confirm && <p className="text-xs text-red-500 mt-0.5">{pwdErrors.confirm}</p>}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordMutation.isPending}
              className="btn-primary gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {passwordMutation.isPending ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
