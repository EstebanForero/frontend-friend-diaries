import * as React from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CopyableId } from '@/components/ui/copyable-id'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useGroupMembers } from '../hooks/useGroups'
import { useAuthStore } from '@/store/auth.store'

interface MembersSheetProps {
  groupId: string
  groupName: string
}

export function MembersSheet({ groupId, groupName }: MembersSheetProps) {
  const [open, setOpen] = React.useState(false)
  const { user } = useAuthStore()
  const { data: members, isLoading } = useGroupMembers(groupId)

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Users className="size-4" />
        <span className="hidden sm:inline">Members</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{groupName}</SheetTitle>
            <SheetDescription>
              {members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? 's' : ''}
            </SheetDescription>
          </SheetHeader>

          <div className="px-5 pb-8 space-y-2 overflow-y-auto max-h-[60dvh]">
            {isLoading ? (
              <div className="space-y-3 pt-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              members?.map((m) => {
                const isMe = m.user_id === user?.id
                const initials = m.display_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <div
                    key={m.user_id}
                    className="flex items-center gap-3 rounded-xl p-3 hover:bg-accent/40 transition-colors"
                  >
                    <Avatar className="size-10 shrink-0">
                      <AvatarFallback
                        className={`text-sm font-semibold ${
                          isMe
                            ? 'bg-primary/15 text-primary'
                            : 'bg-accent text-accent-foreground'
                        }`}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {m.display_name}
                          {isMe && (
                            <span className="text-xs text-muted-foreground font-normal ml-1">
                              (you)
                            </span>
                          )}
                        </p>
                        {m.role === 'owner' && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            owner
                          </Badge>
                        )}
                      </div>
                      <CopyableId id={m.app_id} className="text-xs mt-0.5 -ml-1" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
