import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';

export interface NotificationLog { id: string; subject: string | null; body: string | null; event: string | null; status: string; createdAt: string; }
export const notificationsService = { async inbox(): Promise<NotificationLog[]> { const { data } = await api.get<ApiResponse<NotificationLog[]>>('/notifications/inbox'); return data.data ?? []; } };
