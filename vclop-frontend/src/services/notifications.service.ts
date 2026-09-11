import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';

export interface NotificationLog {
  id: string;
  subject: string | null;
  body: string | null;
  event: string | null;
  status: string;
  readAt: string | null;
  createdAt: string;
}

export const notificationsService = {
  async inbox(limit = 30): Promise<NotificationLog[]> {
    const { data } = await api.get<ApiResponse<NotificationLog[]>>(`/notifications/inbox?limit=${limit}`);
    return data.data ?? [];
  },

  async unreadCount(): Promise<number> {
    const { data } = await api.get<ApiResponse<number>>('/notifications/unread-count');
    return data.data ?? 0;
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};
