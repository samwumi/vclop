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
  isLoading, isEmpty, emptyIcon, emptyTitle, emptyDescription,
  meta, onPageChange, filters, headerRight,
}: ModulePageProps) {
  const btnClass = (v: ActionButton['variant'] = 'secondary') =>
    v === 'primary' ? 'btn-primary btn-sm' :
    v === 'danger'  ? 'btn-danger btn-sm'  : 'btn-secondary btn-sm';

  const visibleActions = actions.filter((a) => a.permission !== false);

  return (
    <div>
      <Breadcrumbs />

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-gray-600" />}
            {title}
          </h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {headerRight ?? (
          <div className="flex items-center gap-2 flex-wrap">
            {visibleActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={btnClass(action.variant)}
              >
                {action.icon && <action.icon className="w-4 h-4" />}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {children}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          className="w-full sm:w-72"
        />
        {filters && <div className="flex items-center gap-2">{filters}</div>}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={columns.length} />
      ) : isEmpty ? (
        <div className="table-container">
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle ?? `No ${title.toLowerCase()} found`}
            description={emptyDescription ?? 'Nothing to show. Try adjusting your search.'}
          />
        </div>
      ) : (
        <div className="table-container">
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
      )}
    </div>
  );
}
