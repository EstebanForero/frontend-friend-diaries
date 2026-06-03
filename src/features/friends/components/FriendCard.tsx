import * as React from 'react'
import { Tag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CopyableId } from '@/components/ui/copyable-id'
import { FriendLabelSheet } from './FriendLabelSheet'
import { useRemoveFriend } from '../hooks/useFriends'
import type { Friend } from '@/types'
import { FRIEND_TAGS } from '@/types'

interface FriendCardProps {
  friend: Friend
}

export function FriendCard({ friend }: FriendCardProps) {
  const [labelOpen, setLabelOpen] = React.useState(false)
  const { mutate: removeFriend } = useRemoveFriend()

  const displayName = friend.nickname || friend.display_name
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const tagLabel = FRIEND_TAGS.find((t) => t.value === friend.tag)?.label

  const handleRemove = () => {
    removeFriend(friend.friendship_id, {
      onSuccess: () => toast.success('Friend removed'),
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 hover:border-primary/20 transition-colors">
        <Avatar className="size-11 shrink-0">
          <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            {tagLabel && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                {tagLabel}
              </Badge>
            )}
          </div>
          {friend.nickname && (
            <p className="text-xs text-muted-foreground truncate">{friend.display_name}</p>
          )}
          <CopyableId id={friend.app_id} className="text-xs -ml-1" />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            title="Edit label"
            onClick={() => setLabelOpen(true)}
          >
            <Tag className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            title="Remove friend"
            onClick={handleRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <FriendLabelSheet friend={friend} open={labelOpen} onOpenChange={setLabelOpen} />
    </>
  )
}
