/**
 * Generic module page shell.
 * Every module page composes this to get:
 *   - Breadcrumbs
 *   - Page header with title + actions
 *   - Search bar
 *   - Responsive table with loading / empty states
 *   - Pagination
 */
import { type LucideIcon } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { SearchBar } from './SearchBar';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { TableSkeleton } from './LoadingScreen';
import { Pagination } from './Pagination';
import type { PaginationMeta } from '@/types/api.types';

interface ActionButton {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  permission?: boolean;  // show only if true
}

interface Column {
  key: string;
  label: string;
  width?: string;
}

interface ModulePageProps {
  children?: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  search: string;
  onSearchChange: (v: string) => void;
  actions?: ActionButton[];
  columns: Column[];
  rows: React.ReactNode;          // <tr> elements
  isLoading: boolean;
  isEmpty: boolean;
  isError?: boolean;
  error?: Error | string;
  onRetry?: () => void;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  filters?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function ModulePage({
  children,
  title, subtitle, icon: Icon, search, onSearchChange,
  actions = [], columns, rows,
  isLoading, isEmpty, isError, error, onRetry,
  emptyIcon, emptyTitle, emptyDescription,
  meta, onPageChange, filters, headerRight,
}: ModulePageProps) {
  const btnClass = (v: ActionButton['variant'] = 'secondary') =>
    v === 'primary' ? 'btn-primary btn-sm' :
    v === 'danger'  ? 'btn-danger btn-sm'  : 'btn-secondary btn-sm';

  const visibleActions = actions.filter((a) => a.permission !== false);

  return (
    <div className="space-y-4 md:space-y-6 p-mobile md:p-0">
      <Breadcrumbs />

      {/* Premium Page Header - Mobile Responsive */}
      <div className="page-header">
        <div className="min-w-0 flex-1">
          <h1 className="page-title text-responsive-xl flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 md:w-6 md:h-6 icon-premium-static flex-shrink-0" />}
            <span className="truncate">{title}</span>
          </h1>
          {subtitle && <p className="text-responsive-sm text-gray-500 mt-1 line-clamp-2">{subtitle}</p>}
        </div>
        {headerRight ?? (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {visibleActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`${btnClass(action.variant)} touch-target`}
              >
                {action.icon && <action.icon className="w-4 h-4 icon-premium-static" />}
                <span className="hidden sm:inline">{action.label}</span>
                <span className="sm:hidden">{action.label.split(' ').slice(-1)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {children}

      {/* Mobile-Friendly Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          className="w-full sm:w-72"
        />
        {filters && <div className="flex items-center gap-2 flex-wrap">{filters}</div>}
      </div>

      {/* Mobile-Responsive Table with Horizontal Scroll */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={columns.length} />
      ) : isError ? (
        <div className="card-mobile">
          <ErrorState
            title="Failed to load data"
            description="An error occurred while fetching the data. Please try again."
            error={error}
            onRetry={onRetry}
          />
        </div>
      ) : isEmpty ? (
        <div className="card-mobile">
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle ?? `No ${title.toLowerCase()} found`}
            description={emptyDescription ?? 'Nothing to show. Try adjusting your search.'}
          />
        </div>
      ) : (
        <>
          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden md:block table-container">
            <table className="table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>
            {meta && onPageChange && meta.total > meta.limit && (
              <Pagination meta={meta} onPageChange={onPageChange} />
            )}
          </div>

          {/* Mobile Table - Horizontal Scroll */}
          <div className="md:hidden">
            <div className="scroll-x-mobile">
              <div className="table-container" style={{ minWidth: '640px' }}>
                <table className="table">
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{rows}</tbody>
                </table>
              </div>
            </div>
            {meta && onPageChange && meta.total > meta.limit && (
              <div className="mt-4">
                <Pagination meta={meta} onPageChange={onPageChange} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
