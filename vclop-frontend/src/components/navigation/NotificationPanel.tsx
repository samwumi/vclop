import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { notificationsService } from '@/services/notifications.service';

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // Poll unread count every 30 s — lightweight
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsService.unreadCount,
    refetchInterval: 30_000,
  });

  // Load inbox only when panel opens
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'inbox'],
    queryFn: () => notificationsService.inbox(30),
    enabled: open,
    staleTime: 15_000,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsService.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative btn-icon btn-ghost w-9 h-9"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="fixed sm:absolute right-2 sm:right-0 top-[60px] sm:top-full sm:mt-1 w-[calc(100vw-1rem)] sm:w-[340px] max-w-[340px] bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Notifications {unreadCount > 0 && <span className="text-xs font-normal text-gray-400">({unreadCount} unread)</span>}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          {isLoading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={`px-4 py-3 text-sm hover:bg-gray-50 transition-colors flex gap-3 ${!item.readAt ? 'bg-blue-50/40' : ''}`}
                >
                  {/* Unread dot */}
                  <div className="pt-1 flex-shrink-0">
                    {!item.readAt ? (
                      <span className="w-2 h-2 rounded-full bg-brand-600 block" />
                    ) : (
                      <span className="w-2 h-2 block" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {item.subject ?? item.event ?? 'Notification'}
                    </p>
                    {item.body && (
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{item.body}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">{formatDateTime(item.createdAt)}</p>
                  </div>

                  {/* Mark read button */}
                  {!item.readAt && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(item.id); }}
                      className="self-start mt-1 text-gray-300 hover:text-brand-600 flex-shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
