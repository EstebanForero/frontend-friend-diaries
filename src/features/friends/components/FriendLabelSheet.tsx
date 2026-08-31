import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useSetFriendLabel } from '../hooks/useFriends'
import { FRIEND_TAGS, type Friend } from '@/types'
import { cn } from '@/lib/utils'

interface FriendLabelSheetProps {
  friend: Friend
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function FriendLabelSheet({ friend, open, onOpenChange }: FriendLabelSheetProps) {
  const [tag, setTag] = React.useState(friend.tag)
  const [nickname, setNickname] = React.useState(friend.nickname)
  const { mutate: setLabel, isPending } = useSetFriendLabel()

  React.useEffect(() => {
    setTag(friend.tag)
    setNickname(friend.nickname)
  }, [friend])

  const handleSave = () => {
    setLabel(
      { id: friend.friendship_id, tag, nickname },
      {
        onSuccess: () => {
          toast.success('Label saved')
          onOpenChange(false)
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Label {friend.nickname || friend.display_name}</SheetTitle>
          <SheetDescription>Only you can see this — it helps you remember who they are to you.</SheetDescription>
        </SheetHeader>

        <div className="px-5 pb-8 space-y-6">
          {/* Tag pills */}
          <div className="space-y-2">
            <Label>Relationship</Label>
            <div className="flex flex-wrap gap-2">
              {FRIEND_TAGS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTag(tag === t.value ? '' : t.value)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-sm font-medium transition-all',
                    tag === t.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nickname */}
          <div className="space-y-1.5">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              placeholder={`e.g. "My love", "BFF", "${friend.display_name.split(' ')[0]}"`}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">Shown instead of their display name in your Memory Books.</p>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
