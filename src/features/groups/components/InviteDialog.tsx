import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useInviteMember } from '../hooks/useGroups'
import { useFriends } from '@/features/friends/hooks/useFriends'
import { FRIEND_TAGS, type Friend } from '@/types'

interface InviteDialogProps {
  groupId: string
}

export function InviteDialog({ groupId }: InviteDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [appId, setAppId] = React.useState('')
  const { mutate: invite, isPending } = useInviteMember(groupId)
  const { data: friends } = useFriends()

  const handleInvite = (id: string) => {
    const target = id.trim()
    if (!target) return
    invite(
      { invitee_id: target },
      {
        onSuccess: () => {
          toast.success('Memory Book invitation sent!')
          setAppId('')
          setOpen(false)
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <UserPlus className="size-4" />
          Invite
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 bg-card border rounded-2xl shadow-xl p-6 space-y-5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Dialog.Title className="font-semibold text-base">Invite someone</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Pick someone you know or enter an app ID.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="size-8 -mt-1 -mr-1 shrink-0">
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Friends quick-select */}
          {(friends?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Your people</p>
              <div className="space-y-1.5 max-h-44 overflow-y-auto -mx-1 px-1">
                {friends!.map((f) => (
                  <FriendRow
                    key={f.friendship_id}
                    friend={f}
                    onInvite={() => handleInvite(f.user_id)}
                    isPending={isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Manual entry */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-id">Or enter an app ID</Label>
            <Input
              id="invite-id"
              placeholder="e.g. sofia#4821"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite(appId)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </Dialog.Close>
            <Button size="sm" onClick={() => handleInvite(appId)} disabled={!appId.trim() || isPending}>
              {isPending ? 'Sending…' : 'Send invitation'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function FriendRow({ friend, onInvite, isPending }: { friend: Friend; onInvite: () => void; isPending: boolean }) {
  const displayName = friend.nickname || friend.display_name
  const tagLabel = FRIEND_TAGS.find((t) => t.value === friend.tag)?.label
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent/40 transition-colors">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayName}</p>
        {tagLabel && (
          <Badge variant="secondary" className="text-[10px] px-1 py-0 font-normal mt-0.5">
            {tagLabel}
          </Badge>
        )}
      </div>
      <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs" onClick={onInvite} disabled={isPending}>
        Invite
      </Button>
    </div>
  )
}
