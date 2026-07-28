import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function fullName(user: { firstName: string; lastName: string; middleName?: string | null }): string {
  const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean);
  return parts.join(' ');
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export function formatDate(date: string | Date | null | undefined, _format = 'MMM D, YYYY'): string {
  if (!date) return '—';
  // Simple formatter — swap for dayjs if needed
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

export function truncate(str: string, max = 50): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
