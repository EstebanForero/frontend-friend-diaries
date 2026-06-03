import { createFileRoute } from '@tanstack/react-router'
import { Bell, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/features/notifications/hooks/useNotifications'
import { useAcceptInvitation } from '@/features/groups/hooks/useGroups'
import { groupsApi } from '@/features/groups/api/groups.api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatRelativeTime } from '@/lib/utils'
import type { Notification } from '@/types'

export const Route = createFileRoute('/app/notifications')({
  component: NotificationsPage,
})

const NOTIFICATION_COPY: Record<string, string> = {
  new_note: 'wrote a new note in your diary',
  reaction: 'reacted to your note',
  reply: 'replied to your note',
  group_invitation: 'invited you to a diary',
  invitation_accepted: 'accepted your diary invitation',
}

function NotificationsPage() {
  const { data } = useNotifications()
  const { mutate: markAllRead } = useMarkAllNotificationsRead()
  const { mutate: markRead } = useMarkNotificationRead()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {(data?.unread_count ?? 0) > 0 && (
            <Badge>{data?.unread_count}</Badge>
          )}
        </div>
        {(data?.unread_count ?? 0) > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead()}>
            Mark all as read
          </Button>
        )}
      </div>

      {(data?.notifications.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-2 text-center">
          <Bell className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.notifications.map((n) => (
            <NotificationRow
              key={n.id}
              notification={n}
              onRead={() => markRead(n.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationRow({
  notification: n,
  onRead,
}: {
  notification: Notification
  onRead: () => void
}) {
  const qc = useQueryClient()
  const { mutate: accept, isPending: accepting } = useAcceptInvitation()
  const { mutate: decline } = useMutation({
    mutationFn: (groupId: string) => groupsApi.declineInvitation(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] })
      onRead()
    },
  })

  const isInvitation = n.type === 'group_invitation'

  const initials = (n.actor_display_name ?? '?')
    .split(' ')
    .map((x: string) => x[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 transition-colors ${
        !n.is_read ? 'bg-accent/20 border-primary/10' : ''
      }`}
      onClick={() => { if (!n.is_read) onRead() }}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-9 shrink-0 mt-0.5">
          <AvatarFallback
            className={`text-xs font-semibold ${
              isInvitation ? 'bg-primary/15 text-primary' : 'bg-accent text-accent-foreground'
            }`}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-sm">
            <span className="font-semibold">{n.actor_display_name ?? 'Someone'}</span>{' '}
            {NOTIFICATION_COPY[n.type] ?? n.type}
          </p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(n.created_at)}</p>
        </div>
        {!n.is_read && (
          <div className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
        )}
      </div>

      {/* Inline accept/decline for diary invitations */}
      {isInvitation && (
        <div className="flex gap-2 pl-12">
          <Button
            size="sm"
            className="gap-1"
            disabled={accepting}
            onClick={(e) => {
              e.stopPropagation()
              accept(n.reference_id, {
                onSuccess: () => {
                  toast.success('You joined the diary!')
                  onRead()
                },
                onError: (err) => toast.error(err.message),
              })
            }}
          >
            <Check className="size-3.5" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              decline(n.reference_id)
            }}
          >
            <X className="size-3.5" />
            Decline
          </Button>
        </div>
      )}
    </div>
  )
}
