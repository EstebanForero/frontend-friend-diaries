import { Link, useRouter } from '@tanstack/react-router'
import { Bell, BookOpen, Home, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuthStore()
  const { mutate: logout } = useLogout()

  const initials = user?.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-60 flex-col border-r bg-card px-4 py-6 gap-6">
        <div className="flex items-center gap-2 px-2">
          <BookOpen className="size-5 text-primary" />
          <span className="font-semibold">Friend Diaries</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <NavLink to="/app/groups" icon={<Home className="size-4" />} label="Diaries" />
          <NavLink to="/app/notifications" icon={<Bell className="size-4" />} label="Notifications" />
          <NavLink to="/app/settings" icon={<Settings className="size-4" />} label="Settings" />
        </nav>

        <div className="flex items-center gap-3 px-2 pt-4 border-t">
          <Avatar className="size-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.display_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.app_id}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => logout()} title="Sign out">
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}

function NavLink({
  to,
  icon,
  label,
}: {
  to: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground"
    >
      {icon}
      {label}
    </Link>
  )
}
