import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Minimum 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [show, setShow] = useState({ new: false, confirm: false });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      authService.resetPassword(token, values.newPassword),
    onSuccess: () => {
      toast.success('Password reset successfully. Please sign in.');
      navigate('/login');
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid or expired reset link.';
      toast.error(msg);
    },
  });

  if (!token) {
    return (
      <div className="card-body p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid link</h2>
        <p className="text-sm text-gray-500 mb-5">This reset link is missing or invalid.</p>
        <Link to="/auth/forgot-password" className="btn-primary w-full">Request a new link</Link>
      </div>
    );
  }

  return (
    <div className="card-body p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Set new password</h2>
        <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-5">
        <div>
          <label className="form-label" htmlFor="newPassword">New password</label>
          <div className="relative">
            <input
              id="newPassword"
              type={show.new ? 'text' : 'password'}
              autoFocus
              placeholder="••••••••"
              className="form-input pr-10"
              {...register('newPassword')}
            />
            <button type="button" onClick={() => setShow((p) => ({ ...p, new: !p.new }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
              {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && <p className="form-error">{errors.newPassword.message}</p>}
          <p className="form-hint">Min 8 chars, uppercase, number, special character</p>
        </div>

        <div>
          <label className="form-label" htmlFor="confirmPassword">Confirm new password</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={show.confirm ? 'text' : 'password'}
              placeholder="••••••••"
              className="form-input pr-10"
              {...register('confirmPassword')}
            />
            <button type="button" onClick={() => setShow((p) => ({ ...p, confirm: !p.confirm }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
              {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full h-10">
          {mutation.isPending ? <LoadingSpinner className="w-4 h-4" /> : 'Reset password'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
