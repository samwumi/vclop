import { Link, useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-6xl font-bold text-gray-200 mb-2">403</h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access denied</h2>
        <p className="text-gray-500 text-sm mb-8">
          You don't have permission to view this page. Contact your administrator.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary gap-2">
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
          <Link to="/dashboard" className="btn-primary">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
