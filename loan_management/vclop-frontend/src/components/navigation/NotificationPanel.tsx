import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { notificationsService } from '@/services/notifications.service';

export function NotificationPanel() {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  const { data: notifications = [] } = useQuery({ queryKey: ['notifications', 'inbox'], queryFn: notificationsService.inbox, refetchInterval: 60_000 });
  useEffect(() => { const handler = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }, []);
  return <div ref={ref} className="relative"><button onClick={() => setOpen((value) => !value)} className="relative btn-icon btn-ghost w-9 h-9" aria-label="Notifications"><Bell className="w-5 h-5 text-gray-500" />{notifications.length > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{notifications.length > 9 ? '9+' : notifications.length}</span>}</button>{open && <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"><div className="px-4 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-800">Notifications</h3></div>{notifications.length === 0 ? <div className="px-4 py-8 text-center"><Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">No notifications yet</p></div> : <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">{notifications.map((item) => <div key={item.id} className="px-4 py-3 text-sm"><p className="font-medium text-gray-800">{item.subject ?? item.event ?? 'Notification'}</p><p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{item.body ?? item.status}</p><p className="text-gray-400 text-xs mt-1">{formatDateTime(item.createdAt)}</p></div>)}</div>}</div>}</div>;
}
