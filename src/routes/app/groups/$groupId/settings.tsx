import { createFileRoute } from '@tanstack/react-router'
import { useGroup } from '@/features/groups/hooks/useGroups'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/app/groups/$groupId/settings')({
  component: GroupSettingsPage,
})

function GroupSettingsPage() {
  const { groupId } = Route.useParams()
  const { data: group } = useGroup(groupId)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Group Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>{group?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Timezone: {group?.timezone}</p>
        </CardContent>
      </Card>
    </div>
  )
}
