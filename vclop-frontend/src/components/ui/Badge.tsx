import { cn } from '@/lib/utils';
import type { UserStatus } from '@/types/domain.types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple';
  className?: string;
}

const variantMap: Record<NonNullable<BadgeProps['variant']>, string> = {
  green:  'badge-green',
  red:    'badge-red',
  yellow: 'badge-yellow',
  blue:   'badge-blue',
  gray:   'badge-gray',
  purple: 'badge-purple',
};

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={cn(variantMap[variant], className)}>{children}</span>
  );
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const map: Record<UserStatus, { label: string; variant: BadgeProps['variant'] }> = {
    ACTIVE:               { label: 'Active',              variant: 'green' },
    INACTIVE:             { label: 'Inactive',            variant: 'gray' },
    SUSPENDED:            { label: 'Suspended',           variant: 'red' },
    PENDING_VERIFICATION: { label: 'Pending Verification', variant: 'yellow' },
    LOCKED:               { label: 'Locked',              variant: 'red' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'gray' };
  return <Badge variant={variant}>{label}</Badge>;
}
