import { Link } from '@tanstack/react-router'
import { Bell, BookOpen, Settings, Users } from 'lucide-react'

export function MobileNav({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur-md border-t md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 py-1">
        <MobileNavItem to="/app/groups" icon={<BookOpen className="size-5" />} label="Diaries" />
        <MobileNavItem to="/app/friends" icon={<Users className="size-5" />} label="Friends" />
        <MobileNavItem
          to="/app/notifications"
          icon={<Bell className="size-5" />}
          label="Inbox"
          badgeCount={unreadCount}
        />
        <MobileNavItem to="/app/settings" icon={<Settings className="size-5" />} label="Settings" />
      </div>
    </nav>
  )
}

function MobileNavItem({
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
      className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors min-w-[56px] [&.active]:text-primary"
    >
      <span className="relative">
        {icon}
        {badgeCount > 0 && (
          <span className="absolute -right-2 -top-1.5 min-w-3.5 rounded-full bg-primary px-1 text-center text-[9px] font-semibold leading-3.5 text-primary-foreground">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </span>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  )
}
