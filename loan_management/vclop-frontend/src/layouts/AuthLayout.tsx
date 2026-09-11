import { Outlet } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">VCLOP</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4 text-balance">
            Vertical Capital<br />Lending & Operations
          </h1>
          <p className="text-brand-200 text-lg leading-relaxed max-w-md">
            A unified platform for lending operations, compliance, collections,
            and executive reporting — built for scale.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm text-brand-300">
          <span>© {new Date().getFullYear()} Vertical Capital</span>
          <span>·</span>
          <span>All rights reserved</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">VCLOP</span>
          </div>

          <div className="card shadow-2xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
