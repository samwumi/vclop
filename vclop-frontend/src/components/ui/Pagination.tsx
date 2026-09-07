import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaginationMeta } from '@/types/api.types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, total, limit } = meta;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200">
      <p className="text-responsive-xs text-gray-500">
        Showing <span className="font-medium text-gray-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-gray-700">{total}</span>
        <span className="hidden sm:inline"> records</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!meta.hasPrevPage}
          className="touch-target btn-icon btn-secondary disabled:opacity-40 p-1.5"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 icon-premium-static" />
        </button>

        {/* Show fewer page numbers on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={cn(
                  'min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors touch-target',
                  p === page
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200',
                )}
                style={p === page ? { background: 'var(--brand-primary)' } : undefined}
              >
                {p}
              </button>
            ),
          )}
        </div>

        {/* Mobile: Show only current page */}
        <div className="sm:hidden flex items-center px-3">
          <span className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>
            {page} / {totalPages}
          </span>
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!meta.hasNextPage}
          className="touch-target btn-icon btn-secondary disabled:opacity-40 p-1.5"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4 icon-premium-static" />
        </button>
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}
