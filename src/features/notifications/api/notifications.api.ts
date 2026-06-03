import { apiClient } from '@/lib/api/client'
import type { PaginatedNotifications } from '@/types'

export const notificationsApi = {
  list: (page = 1) =>
    apiClient.get<PaginatedNotifications>(`/notifications?page=${page}`),

  markRead: (notificationId: string) =>
    apiClient.post<void>(`/notifications/${notificationId}/read`),

  markAllRead: () =>
    apiClient.post<void>('/notifications/read-all'),
}
