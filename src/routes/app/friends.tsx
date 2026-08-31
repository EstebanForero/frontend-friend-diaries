import { createFileRoute } from '@tanstack/react-router'
import { Check, UserPlus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AddFriendDialog } from '@/features/friends/components/AddFriendDialog'
import { FriendCard } from '@/features/friends/components/FriendCard'
import {
  useFriends,
  useFriendRequests,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
} from '@/features/friends/hooks/useFriends'

export const Route = createFileRoute('/app/friends')({
  component: FriendsPage,
})

function FriendsPage() {
  const { data: friends, isLoading } = useFriends()
  const { data: requests } = useFriendRequests()
  const { mutate: accept } = useAcceptFriendRequest()
  const { mutate: decline } = useDeclineFriendRequest()

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-card/95 backdrop-blur-sm border px-4 py-3 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">People</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Keep the people you share Memory Books with close at hand.
          </p>
        </div>
        <AddFriendDialog />
      </div>

      {/* Pending requests */}
      {(requests?.length ?? 0) > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Requests · {requests!.length}
          </h2>
          <div className="space-y-2">
            {requests!.map((req) => {
              const initials = req.display_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              return (
                <div key={req.friendship_id} className="flex items-center gap-3 rounded-2xl border bg-card p-4">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{req.display_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{req.app_id}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() =>
                        accept(req.friendship_id, {
                          onSuccess: () => toast.success(`You and ${req.display_name} are now connected!`),
                          onError: (e) => toast.error(e.message),
                        })
                      }
                    >
                      <Check className="size-3.5" />
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => decline(req.friendship_id)}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section className="space-y-3">
        {(friends?.length ?? 0) > 0 && (
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Your people · {friends!.length}
          </h2>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : friends?.length === 0 && (requests?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="size-7 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No connections yet</p>
              <p className="text-sm text-muted-foreground">
                Connect using an app ID, then invite them to any Memory Book.
              </p>
            </div>
            <AddFriendDialog
              trigger={
                <Button>
                  <UserPlus className="size-4" />
                  Add your first person
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            {friends?.map((f) => (
              <FriendCard key={f.friendship_id} friend={f} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
