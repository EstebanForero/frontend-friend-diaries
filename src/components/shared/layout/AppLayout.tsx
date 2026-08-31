import { useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { Bell, BookHeart, BookOpen, LogOut, Settings, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CopyableId } from '@/components/ui/copyable-id'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { MobileNav } from '@/components/shared/navigation/MobileNav'
import { useGlobalNotifications } from '@/features/notifications/hooks/useNotifications'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuthStore()
  const { mutate: logout } = useLogout()
  const { data: notificationData } = useGlobalNotifications(!!user)
  const unreadCount = notificationData?.unread_count ?? 0
  const mainRef = useRef<HTMLDivElement>(null)

  // When the virtual keyboard opens on Android (adjustResize mode), the WebView shrinks.
  // scrollIntoView with block:'nearest' on the focused element after the viewport settles
  // is the most reliable way to keep the input visible.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    let rafId: number
    const ensureFocusedVisible = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const el = document.activeElement as HTMLElement | null
        if (!el || !['INPUT', 'TEXTAREA'].includes(el.tagName)) return
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      })
    }

    vv.addEventListener('resize', ensureFocusedVisible)
    return () => {
      vv.removeEventListener('resize', ensureFocusedVisible)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const initials =
    user?.display_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?'

  return (
    <div className="h-screen overflow-hidden flex bg-transparent">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 shrink-0">
            <BookHeart className="size-4 text-primary" />
          </div>
          <span className="font-semibold flex-1">Friend Diaries</span>
          <ThemeToggle />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 p-3 flex-1">
          <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Shared memories
          </p>
          <NavLink to="/app/groups" icon={<BookOpen className="size-4" />} label="Memory Books" />
          <NavLink to="/app/friends" icon={<Users className="size-4" />} label="People" />
          <NavLink
            to="/app/notifications"
            icon={<Bell className="size-4" />}
            label="Notifications"
            badgeCount={unreadCount}
          />

          <p className="mt-4 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Account
          </p>
          <NavLink to="/app/settings" icon={<Settings className="size-4" />} label="Settings" />
        </nav>

        {/* User footer */}
        <div className="p-3 border-t">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-accent/50">
            <Avatar className="size-8 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-none">{user?.display_name}</p>
              {user?.app_id && <CopyableId id={user.app_id} className="text-xs mt-0.5 -ml-1.5" />}
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
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Status bar spacer — fills the notch/status bar area on mobile */}
        <div className="h-[env(safe-area-inset-top)] bg-card md:hidden" />
        {/* Mobile-only top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card md:hidden">
          <div className="flex items-center gap-2">
            <BookHeart className="size-4 text-primary" />
            <span className="font-semibold text-sm">Friend Diaries</span>
          </div>
          <ThemeToggle />
        </div>
        {/* Scrollable content area — this is what actually scrolls on both desktop and mobile */}
        <div ref={mainRef} className="flex-1 overflow-y-auto p-5 pb-24 md:pb-8 md:p-8">
          {children}
        </div>
      </main>

      <MobileNav unreadCount={unreadCount} />
    </div>
  )
}

function NavLink({
  to,
  icon,
  label,
  badgeCount = 0,
}: {
  to: string
  icon: React.ReactNode
  label: string
  badgeCount?: number
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-semibold"
    >
      <span className="relative">
        {icon}
        {badgeCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-3.5 rounded-full bg-primary px-1 text-center text-[9px] font-semibold leading-3.5 text-primary-foreground">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </span>
      <span className="flex-1">{label}</span>
    </Link>
  )
}
