import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-6xl font-bold text-gray-200 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Page not found</h2>
        <p className="text-gray-500 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard" className="btn-primary gap-2">
          <Home className="w-4 h-4" /> Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
