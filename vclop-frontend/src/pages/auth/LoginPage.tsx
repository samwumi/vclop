import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';

const schema = z.object({
  login: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => authService.login(values),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.firstName}!`);
      navigate(from, { replace: true });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid credentials. Please try again.';
      setError('root', { message: msg });
    },
  });

  return (
    <div className="card-body p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
        <p className="text-sm text-gray-500 mt-1">Enter your credentials to access the platform</p>
      </div>

      {errors.root && (
        <div className="flex items-start gap-2.5 p-3 mb-5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errors.root.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-5">
        <div>
          <label className="form-label" htmlFor="login">Email or Username</label>
          <input
            id="login"
            type="text"
            autoComplete="username"
            autoFocus
            placeholder="admin@vclop.local"
            className="form-input"
            {...register('login')}
          />
          {errors.login && <p className="form-error">{errors.login.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="form-label mb-0" htmlFor="password">Password</label>
            <Link
              to="/auth/forgot-password"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="form-input pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary w-full h-10 mt-2"
        >
          {mutation.isPending ? (
            <LoadingSpinner className="w-4 h-4" />
          ) : (
            <><LogIn className="w-4 h-4" /> Sign in</>
          )}
        </button>
      </form>

      <p className="text-xs text-gray-400 text-center mt-6">
        © {new Date().getFullYear()} Vertical Capital — All rights reserved
      </p>
    </div>
  );
}
