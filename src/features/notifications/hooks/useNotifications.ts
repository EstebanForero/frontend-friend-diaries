import { useEffect, useRef } from 'react'
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

// Auto-marks unread notifications as read when the user is viewing the relevant content.
//
// diary page  → pass groupId + date  → marks new_note/reaction/reply for that day
// groups list → pass no args         → marks invitation_accepted for all groups
export function useAutoMarkNotificationsRead(groupId?: string, date?: string) {
  const isGroupsListMode = !groupId && !date
  const isDiaryMode = !!groupId && !!date

  const { data } = useGlobalNotifications(isGroupsListMode || isDiaryMode)
  const { mutate: markRead } = useMarkNotificationRead()
  const markedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!data?.notifications) return

    const toMark = data.notifications.filter((n) => {
      if (n.is_read) return false
      if (markedRef.current.has(n.id)) return false

      if (isGroupsListMode) {
        return n.type === 'invitation_accepted'
      }

      if (isDiaryMode) {
        const nGroupId = n.metadata?.group_id || (n.ref_type === 'note' ? undefined : n.reference_id)
        if (nGroupId && nGroupId !== groupId) return false
        if (!['new_note', 'reaction', 'reply'].includes(n.type)) return false
        const nDate = n.metadata?.date
        return !nDate || nDate === date
      }

      return false
    })

    toMark.forEach((n) => {
      markedRef.current.add(n.id)
      markRead(n.id)
    })
  }, [data?.notifications, groupId, date, isGroupsListMode, isDiaryMode, markRead])
}
