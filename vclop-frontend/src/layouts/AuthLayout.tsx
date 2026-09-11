import { Outlet } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex">

      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur border border-white/20">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight tracking-tight">Vertical Capital</p>
            <p className="text-[11px] text-brand-300 leading-tight">Lending & Operations</p>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-5 text-balance">
            Lend smarter.<br />Grow faster.
          </h1>
          <p className="text-brand-200 text-base leading-relaxed max-w-sm">
            A unified platform for loan origination, compliance review,
            collections, and executive reporting — purpose-built for lending companies.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-10">
            {[
              { n: 'Loan Officers',      d: 'Originate & track' },
              { n: 'Compliance',         d: 'Review & verify' },
              { n: 'Internal Control',   d: 'Audit & approve' },
              { n: 'Accounting',         d: 'Disburse & reconcile' },
            ].map(({ n, d }) => (
              <div key={n} className="p-3 rounded-xl bg-white/10 border border-white/10">
                <p className="text-xs font-semibold text-white">{n}</p>
                <p className="text-[11px] text-brand-300 mt-0.5">{d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-brand-400">
          <span>© {new Date().getFullYear()} Vertical Capital</span>
          <span>·</span>
          <span>All rights reserved</span>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-white leading-tight">Vertical Capital</p>
              <p className="text-xs text-brand-300">Lending & Operations</p>
            </div>
          </div>

          <div className="card shadow-2xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
