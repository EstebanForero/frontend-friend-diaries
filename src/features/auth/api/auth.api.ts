import { apiClient } from '@/lib/api/client'
import type { User } from '@/types'

export interface RegisterPayload {
  email: string
  password: string
  display_name: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token?: string
  user: User
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient.post<User>('/auth/register', payload),

  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload),

  refresh: (refreshToken?: string | null) =>
    apiClient.post<AuthResponse>(
      '/auth/refresh',
      refreshToken ? { refresh_token: refreshToken } : undefined,
      refreshToken ? { headers: { 'X-Refresh-Token': refreshToken } } : undefined,
    ),

  logout: () =>
    apiClient.post<void>('/auth/logout'),

  me: () =>
    apiClient.get<User>('/me'),
}
