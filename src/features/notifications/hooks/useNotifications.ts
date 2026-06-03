import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/notifications.api'

const NOTIFICATION_POLL_INTERVAL_MS = 5000

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (page: number) => [...notificationKeys.all, page] as const,
}

interface NotificationQueryOptions {
  enabled?: boolean
  refetchInterval?: number
  refetchIntervalInBackground?: boolean
  refetchOnWindowFocus?: boolean
  staleTime?: number
}

export function useNotifications(page = 1, options: NotificationQueryOptions = {}) {
  return useQuery({
    queryKey: notificationKeys.list(page),
    queryFn: () => notificationsApi.list(page),
    ...options,
  })
}

export function useGlobalNotifications(enabled: boolean) {
  return useNotifications(1, {
    enabled,
    refetchInterval: NOTIFICATION_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: NOTIFICATION_POLL_INTERVAL_MS - 1000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
