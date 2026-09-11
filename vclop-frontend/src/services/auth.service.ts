import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { AuthResponse, AuthUser, LoginCredentials } from '@/types/auth.types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return data.data!;
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken });
    return data.data!;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  },

  async logoutAll(): Promise<void> {
    await api.post('/auth/logout-all');
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get<ApiResponse<AuthUser>>('/auth/me');
    return data.data!;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.patch('/auth/change-password', { currentPassword, newPassword });
  },

  async verifyEmail(token: string): Promise<void> {
    await api.post('/auth/verify-email', { token });
  },

  async setup2fa(): Promise<{ secret: string; qrCodeUrl: string }> {
    const { data } = await api.post<ApiResponse<{ secret: string; qrCodeUrl: string }>>('/auth/2fa/setup');
    return data.data!;
  },

  async confirm2fa(code: string): Promise<void> {
    await api.post('/auth/2fa/confirm', { code });
  },

  async disable2fa(code: string): Promise<void> {
    await api.post('/auth/2fa/disable', { code });
  },
};
