import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => authService.forgotPassword(values.email),
    onSuccess: () => setSent(true),
  });

  if (sent) {
    return (
      <div className="card-body p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
          If an account with that email exists, a password reset link has been sent.
          It expires in 60 minutes.
        </p>
        <Link to="/auth/login" className="btn-primary w-full">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="card-body p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Reset password</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-5">
        <div>
          <label className="form-label" htmlFor="email">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@company.com"
              className="form-input pl-9"
              {...register('email')}
            />
          </div>
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full h-10">
          {mutation.isPending ? <LoadingSpinner className="w-4 h-4" /> : 'Send reset link'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
