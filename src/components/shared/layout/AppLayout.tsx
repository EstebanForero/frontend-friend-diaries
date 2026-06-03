import { Link } from '@tanstack/react-router'
import { Bell, BookHeart, BookOpen, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CopyableId } from '@/components/ui/copyable-id'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuthStore()
  const { mutate: logout } = useLogout()

  const initials =
    user?.display_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?'

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
            <BookHeart className="size-4 text-primary" />
          </div>
          <span className="font-semibold">Friend Diaries</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 p-3 flex-1">
          <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Your space
          </p>
          <NavLink to="/app/groups" icon={<BookOpen className="size-4" />} label="Diaries" />
          <NavLink to="/app/notifications" icon={<Bell className="size-4" />} label="Notifications" />

          <p className="mt-4 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Account
          </p>
          <NavLink to="/app/settings" icon={<Settings className="size-4" />} label="Settings" />
        </nav>

        {/* User footer */}
        <div className="p-3 border-t">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-accent/50">
            <Avatar className="size-8 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-none">{user?.display_name}</p>
              {user?.app_id && (
                <CopyableId id={user.app_id} className="text-xs mt-0.5 -ml-1.5" />
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => logout()}
              title="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-auto">
        <div className="flex-1 p-5 md:p-8">{children}</div>
      </main>
    </div>
  )
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-semibold"
    >
      {icon}
      {label}
    </Link>
  )
}
