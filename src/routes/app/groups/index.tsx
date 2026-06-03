import { createFileRoute, Link } from '@tanstack/react-router'
import { BookHeart, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGroups } from '@/features/groups/hooks/useGroups'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/app/groups/')({
  component: GroupsPage,
})

function GroupsPage() {
  const { data: groups, isLoading } = useGroups()

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Diaries</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Each diary is a shared space with someone you care about.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/groups/new">
            <Plus className="size-4" />
            New diary
          </Link>
        </Button>
      </div>

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
            <p className="font-medium">No diaries yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first diary and invite someone you love.
            </p>
          </div>
          <Button asChild>
            <Link to="/app/groups/new">Create your first diary</Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {groups?.map((group) => (
            <Link
              key={group.id}
              to="/app/groups/$groupId"
              params={{ groupId: group.id }}
              className="group rounded-2xl border bg-card p-6 flex flex-col gap-4 hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              {/* Icon */}
              <div className="flex items-start justify-between">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <BookHeart className="size-5 text-primary" />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1">
                <p className="font-semibold text-base">{group.name}</p>
                <p className="text-xs text-muted-foreground">
                  Since {formatDate(group.created_at)}
                </p>
              </div>

              <p className="text-xs text-primary font-medium mt-auto">
                Open diary →
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
