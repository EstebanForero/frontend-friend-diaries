import { createFileRoute, Link } from '@tanstack/react-router'
import { BookHeart, Check, Plus, Sparkles, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useGroups, useGroupInvitations, useAcceptInvitation } from '@/features/groups/hooks/useGroups'
import { groupsApi } from '@/features/groups/api/groups.api'
import { formatDate } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAutoMarkNotificationsRead } from '@/features/notifications/hooks/useNotifications'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/groups/')({
  component: GroupsPage,
})

function GroupsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  useAutoMarkNotificationsRead()
  const { data: groups, isLoading } = useGroups()
  const { data: invitations } = useGroupInvitations()
  const { mutate: accept } = useAcceptInvitation()
  const { mutate: decline } = useMutation({
    mutationFn: (groupId: string) => groupsApi.declineInvitation(groupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups', 'invitations'] }),
  })

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="overflow-hidden rounded-3xl border bg-card/95 shadow-sm">
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-5 py-6 sm:px-7">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" /> Keep the moments that matter
          </div>
          <h1 className="text-2xl font-bold">
            Welcome back
            {user?.display_name ? `, ${user.display_name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            A private home for everyday stories with friends, family, partners, and every circle in between.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="rounded-2xl bg-card/95 backdrop-blur-sm border px-4 py-3 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Your Memory Books</h2>
          <p className="text-sm text-muted-foreground mt-0.5">One private space for every story you keep together.</p>
        </div>
        <Button asChild>
          <Link to="/app/groups/new">
            <Plus className="size-4" />
            New book
          </Link>
        </Button>
      </div>

      {/* Pending invitations */}
      {(invitations?.length ?? 0) > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Memory Book invitations · {invitations!.length}
          </h2>
          <div className="space-y-2">
            {invitations!.map((inv) => (
              <div key={inv.group_id} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookHeart className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{inv.group_name}</p>
                  <p className="text-xs text-muted-foreground">Invited {formatDate(inv.invited_at)}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() =>
                      accept(inv.group_id, {
                        onSuccess: () => toast.success(`Joined "${inv.group_name}"!`),
                        onError: (e) => toast.error(e.message),
                      })
                    }
                  >
                    <Check className="size-3.5" />
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decline(inv.group_id)}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Diaries grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl border bg-muted animate-pulse" />
          ))}
        </div>
      ) : groups?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookHeart className="size-7 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">No Memory Books yet</p>
            <p className="text-sm text-muted-foreground">Create a private book and invite someone important to you.</p>
          </div>
          <Button asChild>
            <Link to="/app/groups/new">Create your first book</Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {groups?.map((group) => (
            <Link
              key={group.id}
              to="/app/groups/$groupId"
              params={{ groupId: group.id }}
              search={{ date: undefined, noteId: undefined }}
              className="group rounded-2xl border bg-card p-6 flex flex-col gap-4 hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    'size-12 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-105',
                    bookColorClass(group.color),
                  )}
                >
                  {group.emoji || '📖'}
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Users className="size-3" /> Shared
                </span>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-base">{group.name}</p>
                <p className="text-xs text-muted-foreground">Since {formatDate(group.created_at)}</p>
              </div>
              <p className="text-xs text-primary font-medium mt-auto">Open Memory Book →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function bookColorClass(color?: string) {
  return (
    {
      rose: 'bg-rose-100 dark:bg-rose-950/50',
      amber: 'bg-amber-100 dark:bg-amber-950/50',
      emerald: 'bg-emerald-100 dark:bg-emerald-950/50',
      sky: 'bg-sky-100 dark:bg-sky-950/50',
      violet: 'bg-violet-100 dark:bg-violet-950/50',
      slate: 'bg-slate-200 dark:bg-slate-800',
    }[color ?? 'rose'] ?? 'bg-primary/10'
  )
}
