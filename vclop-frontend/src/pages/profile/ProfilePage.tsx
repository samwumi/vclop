import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { User, Lock, Save, Mail, Clock } from 'lucide-react';
import { api } from '@/lib/axios';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { OtpInput } from '@/components/auth/OtpInput';
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
  const [otpStep, setOtpStep] = useState<'initial' | 'otp-sent' | 'verified'>('initial');
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpError, setOtpError] = useState('');

  // Countdown timer for OTP
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  const requestOtpMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<{ expiresInSeconds: number }>>(
        '/auth/request-password-change-otp',
        { email: user?.email },
      );
      return data.data!;
    },
    onSuccess: (result) => {
      setOtpStep('otp-sent');
      setOtpCountdown(result.expiresInSeconds);
      setOtpError('');
      toast.success('OTP sent to your email');
    },
    onError: (e: unknown) => {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send OTP';
      toast.error(message);
      setOtpError(message);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/auth/change-password-with-otp', {
        currentPassword: pwd.current,
        newPassword: pwd.next,
        otpCode,
      });
    },
    onSuccess: () => {
      toast.success('Password changed successfully. Please log in again.');
      setPwd({ current: '', next: '', confirm: '' });
      setOtpCode('');
      setOtpStep('initial');
      setOtpCountdown(0);
      updateUser({ mustChangePassword: false });
    },
    onError: (e: unknown) => {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Password change failed';
      toast.error(message);
      setOtpError(message);
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!pwd.current) errs.current = 'Current password is required';
    if (!pwd.next || pwd.next.length < 8) errs.next = 'New password must be at least 8 characters';
    if (pwd.next !== pwd.confirm) errs.confirm = 'Passwords do not match';
    setPwdErrors(errs);
    if (Object.keys(errs).length) return;

    // Step 1: Request OTP
    if (otpStep === 'initial') {
      requestOtpMutation.mutate();
      return;
    }

    // Step 2: Verify OTP and change password
    if (otpStep === 'otp-sent') {
      if (otpCode.length !== 6) {
        setOtpError('Please enter the 6-digit OTP code');
        return;
      }
      passwordMutation.mutate();
    }
  };

  const handleResendOtp = () => {
    setOtpCode('');
    setOtpError('');
    requestOtpMutation.mutate();
  };

  const handleCancelOtp = () => {
    setOtpStep('initial');
    setOtpCode('');
    setOtpError('');
    setOtpCountdown(0);
    setPwd({ current: '', next: '', confirm: '' });
    setPwdErrors({});
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
          {/* Step indicator */}
          {otpStep !== 'initial' && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Mail className="w-4 h-4" />
                <span className="font-medium">OTP Verification Required</span>
              </div>
              {otpCountdown > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-blue-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-semibold">{formatTime(otpCountdown)}</span>
                </div>
              )}
            </div>
          )}

          {/* Password fields - shown initially or when editing */}
          {otpStep === 'initial' && (
            <>
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
                  disabled={requestOtpMutation.isPending}
                  className="btn-primary gap-2 disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  {requestOtpMutation.isPending ? 'Sending OTP…' : 'Send OTP to Email'}
                </button>
              </div>
            </>
          )}

          {/* OTP verification step */}
          {otpStep === 'otp-sent' && (
            <>
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">
                    We've sent a 6-digit code to
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mb-4">
                    {user?.email}
                  </p>
                </div>

                <div className="py-2">
                  <OtpInput
                    value={otpCode}
                    onChange={(value) => {
                      setOtpCode(value);
                      setOtpError('');
                    }}
                    disabled={passwordMutation.isPending}
                    error={!!otpError}
                    autoFocus
                  />
                </div>

                {otpError && (
                  <div className="text-center">
                    <p className="text-sm text-red-500">{otpError}</p>
                  </div>
                )}

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpCountdown > 0 || requestOtpMutation.isPending}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {requestOtpMutation.isPending ? 'Sending…' : 'Resend OTP'}
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={handleCancelOtp}
                    disabled={passwordMutation.isPending}
                    className="text-sm text-gray-600 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordMutation.isPending || otpCode.length !== 6}
                  className="btn-primary gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  {passwordMutation.isPending ? 'Changing Password…' : 'Change Password'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
