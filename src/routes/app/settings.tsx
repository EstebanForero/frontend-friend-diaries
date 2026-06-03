import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CopyableId } from '@/components/ui/copyable-id'

export const Route = createFileRoute('/app/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your public identity inside Friend Diaries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Display name</span>
            <span className="text-sm font-medium">{user?.display_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">App ID</span>
            <div className="flex flex-col items-end gap-0.5">
              {user?.app_id && <CopyableId id={user.app_id} className="text-sm" />}
              <span className="text-[11px] text-muted-foreground">Share this so friends can invite you</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <Badge variant={user?.is_premium ? 'default' : 'secondary'}>
              {user?.is_premium ? 'Premium' : 'Free'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
