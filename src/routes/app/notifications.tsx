import { createFileRoute } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotifications, useMarkAllNotificationsRead } from '@/features/notifications/hooks/useNotifications'
import { formatRelativeTime } from '@/lib/utils'

export const Route = createFileRoute('/app/notifications')({
  component: NotificationsPage,
})

const NOTIFICATION_LABELS: Record<string, string> = {
  new_note: 'wrote a new note',
  reaction: 'reacted to your note',
  reply: 'replied to your note',
  group_invitation: 'invited you to a diary',
  invitation_accepted: 'accepted your invitation',
}

function NotificationsPage() {
  const { data } = useNotifications()
  const { mutate: markAllRead } = useMarkAllNotificationsRead()

  return (
    <div className="max-w-2xl space-y-6">
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

      {data?.notifications.length === 0 ? (
        <div className="text-center py-20 space-y-2">
          <Bell className="size-8 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-4 space-y-1 transition-colors ${
                !n.is_read ? 'bg-accent/30' : ''
              }`}
            >
              <p className="text-sm">
                <span className="font-medium">Someone</span>{' '}
                {NOTIFICATION_LABELS[n.type] ?? n.type}
              </p>
              <p className="text-xs text-muted-foreground">{formatRelativeTime(n.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
