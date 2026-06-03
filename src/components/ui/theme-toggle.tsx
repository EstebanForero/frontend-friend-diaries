import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme, type ThemeMode } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

const CYCLE: ThemeMode[] = ['system', 'light', 'dark']

const CONFIG: Record<ThemeMode, { icon: React.ReactNode; label: string }> = {
  system: { icon: <Monitor className="size-4" />, label: 'Following system' },
  light:  { icon: <Sun    className="size-4" />, label: 'Light mode' },
  dark:   { icon: <Moon   className="size-4" />, label: 'Dark mode' },
}

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { mode, setTheme } = useTheme()

  const handleClick = () => {
    const idx = CYCLE.indexOf(mode)
    setTheme(CYCLE[(idx + 1) % CYCLE.length])
  }

  const { icon, label } = CONFIG[mode]

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('size-8 shrink-0 text-muted-foreground hover:text-foreground', className)}
      onClick={handleClick}
      title={label}
      aria-label={label}
    >
      {icon}
    </Button>
  )
}
