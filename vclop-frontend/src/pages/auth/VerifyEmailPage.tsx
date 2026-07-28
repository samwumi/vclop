import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const token = params.get('token');

  useEffect(() => {
    if (!token) { setState('error'); return; }
    authService.verifyEmail(token).then(() => setState('success')).catch(() => setState('error'));
  }, [token]);

  return <div className="card-body p-8 text-center"><div className="mb-5">{state === 'loading' && <LoadingSpinner className="w-7 h-7 mx-auto" />}{state === 'success' && <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />}{state === 'error' && <XCircle className="w-10 h-10 text-red-600 mx-auto" />}</div><h2 className="text-xl font-bold text-gray-900">{state === 'loading' ? 'Verifying email…' : state === 'success' ? 'Email verified' : 'Verification link is invalid or expired'}</h2><p className="text-sm text-gray-500 mt-2">{state === 'success' ? 'Your account is active. You can now sign in.' : state === 'loading' ? 'Please wait while we activate your account.' : 'Ask an administrator to create a new verification link.'}</p>{state !== 'loading' && <Link to="/auth/login" className="btn-primary mt-6 inline-flex">Go to sign in</Link>}</div>;
}
