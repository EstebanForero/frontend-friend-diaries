import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGroups } from '@/features/groups/hooks/useGroups'
import { formatDate } from '@/lib/utils'

export const Route = createFileRoute('/app/groups/')({
  component: GroupsPage,
})

function GroupsPage() {
  const { data: groups, isLoading } = useGroups()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Diaries</h1>
          <p className="text-muted-foreground text-sm">Select a diary to start writing</p>
        </div>
        <Button asChild>
          <Link to="/app/groups/new">
            <Plus className="size-4" />
            New diary
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border bg-muted animate-pulse" />
          ))}
        </div>
      ) : groups?.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <p className="text-muted-foreground">You don&apos;t have any diaries yet.</p>
          <Button asChild>
            <Link to="/app/groups/new">Create your first diary</Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups?.map((group) => (
            <Link key={group.id} to="/app/groups/$groupId" params={{ groupId: group.id }}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base">{group.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Created {formatDate(group.created_at)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
