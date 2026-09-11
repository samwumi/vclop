/**
 * Skeleton loaders for various UI components
 * Provides better UX than blank screens or spinners
 */

export function CardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="h-3 bg-gray-100 rounded w-4/6" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
          <div className="h-6 bg-gray-200 rounded w-24 mb-1" />
          <div className="h-2 bg-gray-100 rounded w-16" />
        </div>
        <div className="w-10 h-10 rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="card p-6 space-y-4 animate-pulse">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-10 bg-gray-100 rounded w-full" />
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <div className="h-9 bg-brand-200 rounded w-24" />
        <div className="h-9 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="h-8 bg-gray-100 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
      <div 
        className="bg-gray-100 rounded-lg w-full flex items-end justify-around gap-2 p-4"
        style={{ height: `${height}px` }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-t w-full"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-pulse">
      {/* Header card */}
      <div className="card p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="h-6 bg-gray-200 rounded w-40 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-32" />
          </div>
          <div className="h-6 bg-gray-200 rounded w-24" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 bg-gray-200 rounded w-16 mb-1" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Content cards */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="card p-6 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-5/6" />
            <div className="h-3 bg-gray-100 rounded w-4/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Inline skeleton for small components
 */
export function InlineSkeleton({ width = '100%', height = '1rem', className = '' }: { 
  width?: string; 
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse ${className}`}
      style={{ width, height }}
    />
  );
}
