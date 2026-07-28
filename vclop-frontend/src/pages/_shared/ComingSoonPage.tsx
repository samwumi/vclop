import type { LucideIcon } from 'lucide-react';
import { Clock, Wrench } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface ComingSoonPageProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  phase?: string;
  features?: string[];
}

export function ComingSoonPage({
  title,
  subtitle,
  icon,
  phase = 'Phase 2',
  features = [],
}: ComingSoonPageProps) {
  return (
    <div>
      <Breadcrumbs />
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          {icon && (
            <>
              {icon.displayName && <span className="sr-only">{icon.displayName}</span>}
              {(() => {
                const Icon = icon;
                return <Icon className="w-5 h-5 text-gray-600" />;
              })()}
            </>
          )}
          {title}
        </h1>
        <span className="badge-yellow text-xs px-2.5 py-1">
          {phase}
        </span>
      </div>

      <div className="card">
        <div className="card-body py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Coming in {phase}</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            {subtitle ?? `The ${title} module is scheduled for ${phase}. The foundation and database schema are already in place.`}
          </p>

          {features.length > 0 && (
            <div className="inline-flex flex-col gap-2 text-left mx-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Planned features</p>
              {features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
