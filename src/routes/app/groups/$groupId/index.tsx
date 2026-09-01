import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Plus,
  Send,
  User,
  CalendarDays,
  X,
  ImagePlus,
  Flame,
  Download,
  RefreshCw,
  Share2,
  Film,
  Crown,
  Settings,
  Clock3,
  ImageIcon,
  CloudUpload,
  CircleAlert,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useGroup, useGroupMembers } from '@/features/groups/hooks/useGroups'
import {
  useNotesByDate,
  useCreateNote,
  useCalendarSummary,
  useAdjacentDates,
  useStreak,
  useRecentNotes,
} from '@/features/notes/hooks/useNotes'
import { useAutoMarkNotificationsRead } from '@/features/notifications/hooks/useNotifications'
import { useAuthStore } from '@/store/auth.store'
import { InviteDialog } from '@/features/groups/components/InviteDialog'
import { MembersSheet } from '@/features/groups/components/MembersSheet'
import { formatDate, formatTime, formatTimeInZone, todayDateString, todayInZone, resolveMediaUrl } from '@/lib/utils'
import { useCreateReply, useReplies } from '@/features/replies/hooks/useReplies'
import { useReactions, useRemoveReaction, useUpsertReaction } from '@/features/reactions/hooks/useReactions'
import { cn } from '@/lib/utils'
import { prepareVideoForUpload } from '@/lib/media/video'
import type { GroupMemberDetail, Note, NoteMedia, ReactionType } from '@/types'
import { DEFAULT_REACTION_EMOJIS, reactionEmoji } from '@/types'
import { OfflineImage } from '@/components/shared/OfflineImage'

interface PendingMedia {
  localUrl: string
  kind: 'image' | 'video'
  file?: File
  uploading: boolean
  compressionProgress?: number
  error?: boolean
}

export const Route = createFileRoute('/app/groups/$groupId/')({
  validateSearch: (search: Record<string, unknown>) => ({
    date: typeof search.date === 'string' ? search.date : undefined,
    noteId: typeof search.noteId === 'string' ? search.noteId : undefined,
  }),
  component: MemoryBookPage,
})

type ViewMode = 'mine' | 'all' | string // 'mine', 'all', or a member's user_id

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function CalendarPicker({
  value,
  onChange,
  onMonthChange,
  onClose,
  counts = {},
  today = todayDateString(),
}: {
  value: string
  onChange: (date: string) => void
  onMonthChange: (month: string) => void
  onClose: () => void
  counts?: Record<string, number>
  today?: string
}) {
  const [month, setMonth] = useState(() => {
    const d = new Date(value + 'T00:00:00')
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  useEffect(() => {
    const d = new Date(value + 'T00:00:00')
    if (!Number.isNaN(d.getTime())) {
      setMonth({ year: d.getFullYear(), month: d.getMonth() })
    }
  }, [value])

  useEffect(() => {
    onMonthChange(`${month.year}-${String(month.month + 1).padStart(2, '0')}`)
  }, [month, onMonthChange])

  const firstDay = new Date(month.year, month.month, 1).getDay()
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate()
  const selectedDate = value

  const prevMonth = () => {
    setMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }))
  }
  const nextMonth = () => {
    const next = month.month === 11 ? { year: month.year + 1, month: 0 } : { year: month.year, month: month.month + 1 }
    const firstOfNext = `${next.year}-${String(next.month + 1).padStart(2, '0')}-01`
    if (firstOfNext <= today) setMonth(next)
  }

  const isNextDisabled = () => {
    const next = month.month === 11 ? { year: month.year + 1, month: 0 } : { year: month.year, month: month.month + 1 }
    return `${next.year}-${String(next.month + 1).padStart(2, '0')}-01` > today
  }

  const selectDay = (day: number) => {
    const d = `${month.year}-${String(month.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (d <= today) {
      onChange(d)
      onClose()
    }
  }

  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1
    return day > 0 && day <= daysInMonth ? day : null
  })

  return (
    <div className="w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border bg-card/95 p-4 shadow-xl backdrop-blur-sm">
      {/* Month/year header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Previous month"
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{MONTHS[month.month]}</span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setMonth((m) => ({ ...m, year: m.year - 1 }))}
              aria-label="Previous year"
              className="p-0.5 rounded hover:bg-accent transition-colors"
            >
              <ChevronLeft className="size-3" />
            </button>
            <span className="text-sm tabular-nums w-10 text-center">{month.year}</span>
            <button
              type="button"
              onClick={() => {
                const next = { ...month, year: month.year + 1 }
                const firstOfNext = `${next.year}-${String(next.month + 1).padStart(2, '0')}-01`
                if (firstOfNext <= today) setMonth(next)
              }}
              aria-label="Next year"
              className="p-0.5 rounded hover:bg-accent transition-colors"
            >
              <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={nextMonth}
          disabled={isNextDisabled()}
          aria-label="Next month"
          className="p-1.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dateStr = `${month.year}-${String(month.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isFuture = dateStr > today
          const isSelected = dateStr === selectedDate
          const isTodayDate = dateStr === today
          const count = counts[dateStr] ?? 0
          return (
            <button
              key={day}
              type="button"
              disabled={isFuture}
              onClick={() => selectDay(day)}
              className={cn(
                'mx-auto flex flex-col items-center justify-center rounded-full text-sm transition-colors size-8',
                isFuture && 'opacity-25 cursor-not-allowed',
                isSelected && 'bg-primary text-primary-foreground font-semibold',
                !isSelected && isTodayDate && 'font-semibold text-primary ring-1 ring-primary/50',
                !isSelected && !isFuture && 'hover:bg-accent',
              )}
            >
              <span className="leading-none">{day}</span>
              {count > 0 && !isFuture && (
                <span
                  className={cn('mt-0.5 h-1 w-1 rounded-full', isSelected ? 'bg-primary-foreground' : 'bg-primary')}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Today shortcut */}
      <div className="mt-3 border-t pt-3">
        <button
          type="button"
          onClick={() => {
            onChange(today)
            onClose()
          }}
          className="w-full text-xs text-center text-primary font-medium hover:underline"
        >
          Go to today
        </button>
      </div>
    </div>
  )
}

function MemoryBookPage() {
  const { groupId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { user } = useAuthStore()
  const [date, setDate] = useState(search.date ?? todayDateString())
  const [content, setContent] = useState('')
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [showCalendar, setShowCalendar] = useState(false)
  const dateButtonRef = useRef<HTMLButtonElement>(null)
  const calendarPopoverRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 })

  const positionCalendar = useCallback(() => {
    const trigger = dateButtonRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const viewportPadding = 12
    const gap = 8
    const width = calendarPopoverRef.current?.offsetWidth ?? 288
    const height = calendarPopoverRef.current?.offsetHeight ?? 360
    const maxLeft = Math.max(viewportPadding, window.innerWidth - width - viewportPadding)
    const left = Math.min(Math.max(rect.left, viewportPadding), maxLeft)
    const fitsBelow = rect.bottom + gap + height <= window.innerHeight - viewportPadding
    const top = fitsBelow
      ? rect.bottom + gap
      : Math.max(viewportPadding, Math.min(rect.top - height - gap, window.innerHeight - height - viewportPadding))

    setCalendarPos({ top, left })
  }, [])

  useEffect(() => {
    if (!showCalendar) return

    const frame = window.requestAnimationFrame(() => {
      positionCalendar()
      calendarPopoverRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    })
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (dateButtonRef.current?.contains(target)) return
      if (calendarPopoverRef.current?.contains(target)) return
      setShowCalendar(false)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCalendar(false)
        dateButtonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', positionCalendar)
    window.addEventListener('scroll', positionCalendar, true)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', positionCalendar)
      window.removeEventListener('scroll', positionCalendar, true)
    }
  }, [positionCalendar, showCalendar])

  const { data: group } = useGroup(groupId)
  const { data: members } = useGroupMembers(groupId)

  // "Today" in the diary's timezone — may differ from the user's local date
  const diaryToday = todayInZone(group?.timezone)

  // Once the group timezone is known and no date was specified in the URL,
  // snap the default date to "today in the diary's timezone"
  useEffect(() => {
    if (group?.timezone && !search.date) {
      setDate(todayInZone(group.timezone))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.timezone])
  const { data: notes, isLoading, refetch: refetchNotes } = useNotesByDate(groupId, date)
  const { data: recentNotes, isLoading: isRecentLoading } = useRecentNotes(groupId)
  const { mutate: createNote, isPending: isCreating } = useCreateNote(groupId, date)

  const [calendarMonth, setCalendarMonth] = useState(() => date.slice(0, 7))
  const calendarAuthorId = viewMode === 'all' ? undefined : viewMode === 'mine' ? user?.id : viewMode
  const { data: calendarCounts } = useCalendarSummary(groupId, calendarMonth, calendarAuthorId)
  const { data: adjacent, isPending: isAdjacentPending } = useAdjacentDates(groupId, date, calendarAuthorId)
  const { data: streak } = useStreak(groupId, calendarAuthorId ?? user?.id)

  // Pull-to-refresh
  const pullStartY = useRef<number | null>(null)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handlePullStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const scrollContainer = e.currentTarget.closest<HTMLElement>('.overflow-y-auto')
    if ((scrollContainer?.scrollTop ?? window.scrollY) <= 0) pullStartY.current = e.touches[0].clientY
  }
  const handlePullMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (pullStartY.current === null) return
    const dy = e.touches[0].clientY - pullStartY.current
    setIsPulling(dy > 60)
  }
  const handlePullEnd = async () => {
    if (isPulling) {
      setIsRefreshing(true)
      await refetchNotes()
      setIsRefreshing(false)
    }
    pullStartY.current = null
    setIsPulling(false)
  }

  useAutoMarkNotificationsRead(groupId, date)

  const canWrite = date === diaryToday

  const visibleNotes = (notes ?? []).filter((n) =>
    viewMode === 'mine' ? n.author_id === user?.id : viewMode === 'all' ? true : n.author_id === viewMode,
  )

  useEffect(() => {
    if (search.date) setDate(search.date)
  }, [search.date])

  useEffect(() => {
    setCalendarMonth(date.slice(0, 7))
  }, [date])

  useEffect(() => {
    if (!search.noteId || isLoading) return
    document.getElementById(`note-${search.noteId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [search.noteId, isLoading, notes])

  const prevDay = () => {
    if (adjacent?.prev) setDate(adjacent.prev)
  }
  const nextAvailableDate = isAdjacentPending ? null : (adjacent?.next ?? (date < diaryToday ? diaryToday : null))
  const nextDay = () => {
    if (nextAvailableDate) setDate(nextAvailableDate)
  }

  const openRecentMemory = (note: Note) => {
    setViewMode('all')
    setDate(note.diary_date)
    void navigate({
      to: '/app/groups/$groupId',
      params: { groupId },
      search: { date: note.diary_date, noteId: note.id },
    })
  }

  const uploadFile = useCallback(
    async (file: File) => {
      const isVideo = file.type.startsWith('video/')
      if (!file.type.startsWith('image/') && !isVideo) {
        toast.error('Choose a photo or video')
        return
      }
      if (!isVideo && file.size > 10 * 1024 * 1024) {
        toast.error('Photos must be under 10 MB')
        return
      }
      if (isVideo && !user?.is_premium) {
        toast.error('Video memories are available on Premium')
        return
      }
      if (isVideo && pendingMedia.some((item) => item.kind === 'video')) {
        toast.error('Add one video per memory')
        return
      }

      const localUrl = URL.createObjectURL(file)
      const placeholder: PendingMedia = {
        localUrl,
        kind: isVideo ? 'video' : 'image',
        uploading: true,
        compressionProgress: isVideo ? 0 : undefined,
      }
      setPendingMedia((prev) => [...prev, placeholder])

      try {
        const preparedFile = isVideo
          ? (
              await prepareVideoForUpload(file, (progress) => {
                setPendingMedia((prev) =>
                  prev.map((item) => (item.localUrl === localUrl ? { ...item, compressionProgress: progress } : item)),
                )
              })
            ).file
          : file
        setPendingMedia((prev) =>
          prev.map((p) =>
            p.localUrl === localUrl
              ? {
                  ...p,
                  file: preparedFile,
                  uploading: false,
                  compressionProgress: 100,
                }
              : p,
          ),
        )
      } catch (error) {
        URL.revokeObjectURL(localUrl)
        setPendingMedia((prev) => prev.filter((p) => p.localUrl !== localUrl))
        toast.error(error instanceof Error ? error.message : 'Failed to upload media')
      }
    },
    [pendingMedia, user?.is_premium],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    files.forEach(uploadFile)
    e.target.value = ''
  }

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const imageFile = Array.from(e.clipboardData.items)
        .find((item) => item.type.startsWith('image/'))
        ?.getAsFile()
      if (imageFile) {
        e.preventDefault()
        void uploadFile(imageFile)
      }
    },
    [uploadFile],
  )

  const removePending = (localUrl: string) => {
    URL.revokeObjectURL(localUrl)
    setPendingMedia((prev) => prev.filter((p) => p.localUrl !== localUrl))
  }

  const handleSubmit = () => {
    const mediaFiles = pendingMedia.flatMap((item) => (item.file ? [item.file] : []))
    if (!content.trim() && mediaFiles.length === 0) return
    if (pendingMedia.some((p) => p.uploading)) {
      toast.info('Media is still preparing…')
      return
    }
    createNote(
      {
        content: content.trim(),
        date,
        media_files: mediaFiles.length > 0 ? mediaFiles : undefined,
      },
      {
        onSuccess: () => {
          setContent('')
          pendingMedia.forEach((p) => URL.revokeObjectURL(p.localUrl))
          setPendingMedia([])
          toast.success(
            navigator.onLine ? 'Memory saved. Syncing now…' : 'Saved offline. It will sync when you reconnect.',
          )
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  return (
    <div
      className="mx-auto grid max-w-6xl items-start gap-6 xl:grid-cols-[minmax(0,42rem)_18rem]"
      onTouchStart={handlePullStart}
      onTouchMove={handlePullMove}
      onTouchEnd={() => void handlePullEnd()}
    >
      <main className="min-w-0 space-y-6">
        {/* Pull-to-refresh indicator */}
        {(isPulling || isRefreshing) && (
          <div className="flex justify-center pt-1 pb-2">
            <div
              className={cn(
                'flex items-center gap-2 rounded-full bg-card/90 border px-3 py-1.5 text-xs text-muted-foreground shadow-sm',
                isRefreshing && 'text-primary',
              )}
            >
              <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
              {isRefreshing ? 'Refreshing…' : 'Release to refresh'}
            </div>
          </div>
        )}
        {/* Header bubble */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex-1 rounded-2xl bg-card/95 backdrop-blur-sm border px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>
                    {group?.emoji ?? '📖'}
                  </span>
                  <h1 className="text-base font-bold leading-none truncate">{group?.name ?? '…'}</h1>
                  {(streak?.current ?? 0) > 0 && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold shrink-0',
                        streak?.recoverable
                          ? 'bg-orange-100 text-orange-500 dark:bg-orange-900/30'
                          : 'bg-orange-500/15 text-orange-500',
                      )}
                    >
                      <Flame className="size-3" />
                      {streak!.current}
                      {streak?.recoverable && <span className="ml-0.5 opacity-70">!</span>}
                    </span>
                  )}
                </div>
                <div className="relative mt-1.5">
                  <button
                    ref={dateButtonRef}
                    type="button"
                    onClick={() => {
                      setShowCalendar((v) => !v)
                    }}
                    aria-haspopup="dialog"
                    aria-expanded={showCalendar}
                    aria-controls="memory-calendar"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CalendarDays className="size-3 shrink-0" />
                    {formatDate(date)}
                  </button>
                </div>
                {showCalendar &&
                  createPortal(
                    <div
                      ref={calendarPopoverRef}
                      id="memory-calendar"
                      role="dialog"
                      aria-label="Choose a memory date"
                      className="fixed z-[9999]"
                      style={{ top: calendarPos.top, left: calendarPos.left }}
                    >
                      <CalendarPicker
                        value={date}
                        onMonthChange={setCalendarMonth}
                        onChange={setDate}
                        onClose={() => {
                          setShowCalendar(false)
                          window.requestAnimationFrame(() =>
                            dateButtonRef.current?.focus({
                              preventScroll: true,
                            }),
                          )
                        }}
                        counts={calendarCounts ?? {}}
                        today={diaryToday}
                      />
                    </div>,
                    document.body,
                  )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="size-7" onClick={prevDay} disabled={!adjacent?.prev}>
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={nextDay}
                  disabled={!nextAvailableDate}
                  aria-label={adjacent?.next ? 'Next memory date' : 'Go to today'}
                  title={adjacent?.next ? 'Next memory date' : 'Go to today'}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
            <MembersSheet groupId={groupId} groupName={group?.name ?? ''} />
            <InviteDialog groupId={groupId} />
            {group?.owner_id === user?.id && (
              <Button variant="outline" size="icon" className="size-9" asChild title="Memory Book settings">
                <Link to="/app/groups/$groupId/settings" params={{ groupId }}>
                  <Settings className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* View mode toggle — my timeline + per-member + our timeline */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setViewMode('mine')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'mine'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card/90 backdrop-blur-sm border text-muted-foreground hover:text-foreground',
            )}
          >
            <User className="size-3.5" />
            My moments
          </button>
          {(members ?? [])
            .filter((m) => m.user_id !== user?.id)
            .map((m) => {
              const initials = m.display_name
                .split(' ')
                .map((p: string) => p[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
              return (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => setViewMode(m.user_id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    viewMode === m.user_id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card/90 backdrop-blur-sm border text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="flex size-4 items-center justify-center rounded-full bg-current/20 text-[9px] font-bold shrink-0">
                    {initials}
                  </span>
                  {m.display_name}
                </button>
              )
            })}
          {/* Together — all members */}
          {(members ?? []).length > 1 && (
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card/90 backdrop-blur-sm border text-muted-foreground hover:text-foreground',
              )}
            >
              Together
            </button>
          )}
        </div>

        <RecentMemoriesMobile
          notes={recentNotes ?? []}
          isLoading={isRecentLoading}
          members={members ?? []}
          today={diaryToday}
          onOpen={openRecentMemory}
        />

        {/* Notes */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl border bg-muted/80 backdrop-blur-sm animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {visibleNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isOwn={note.author_id === user?.id}
                currentUserId={user?.id}
                diaryTimezone={group?.timezone}
                members={members ?? []}
                isTarget={note.id === search.noteId}
              />
            ))}
            {visibleNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  {viewMode === 'mine' && canWrite
                    ? 'You have not added a moment today yet.'
                    : viewMode === 'mine'
                      ? 'No moments from you on this day.'
                      : viewMode === 'all'
                        ? 'No memories were added on this day.'
                        : 'No moments from this person on this day.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Write box */}
        {canWrite && (
          <div className="rounded-2xl border bg-card/90 backdrop-blur-sm shadow-sm overflow-hidden">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Textarea
              placeholder="Share a moment from today…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
              }}
              onPaste={handlePaste}
              className="resize-none min-h-[120px] border-0 focus-visible:ring-0 rounded-none px-5 pt-4 pb-2 text-sm leading-relaxed bg-transparent"
              onFocus={(e) =>
                e.currentTarget.closest('.rounded-2xl')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
              }
            />
            {pendingMedia.length > 0 && (
              <div className="flex flex-wrap gap-2 px-5 pb-3">
                {pendingMedia.map((media) => (
                  <div
                    key={media.localUrl}
                    className="relative size-20 shrink-0 rounded-lg overflow-hidden border bg-muted"
                  >
                    {media.kind === 'video' ? (
                      <video src={media.localUrl} muted playsInline className="size-full object-cover" />
                    ) : (
                      <img src={media.localUrl} alt="" className="size-full object-cover" />
                    )}
                    {media.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="text-center text-[10px] font-medium text-white">
                          <div className="mx-auto mb-1 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          {media.kind === 'video' && `${Math.round((media.compressionProgress ?? 0) * 100)}%`}
                        </div>
                      </div>
                    )}
                    {!media.uploading && (
                      <button
                        type="button"
                        onClick={() => removePending(media.localUrl)}
                        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ImagePlus className="size-4" />
                  <span className="hidden sm:inline">Photo or video</span>
                  {!user?.is_premium && <Crown className="size-3 text-amber-500" />}
                </button>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  · <kbd className="font-mono">⌘ Enter</kbd> to post
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={
                  (!content.trim() && pendingMedia.length === 0) || isCreating || pendingMedia.some((p) => p.uploading)
                }
                className="gap-1.5"
              >
                <Send className="size-3.5" />
                {isCreating ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </div>
        )}
      </main>

      <RecentMemoriesSidebar
        notes={recentNotes ?? []}
        isLoading={isRecentLoading}
        members={members ?? []}
        today={diaryToday}
        diaryTimezone={group?.timezone}
        onOpen={openRecentMemory}
      />
    </div>
  )
}

function RecentMemoriesMobile({
  notes,
  isLoading,
  members,
  today,
  onOpen,
}: {
  notes: Note[]
  isLoading: boolean
  members: GroupMemberDetail[]
  today: string
  onOpen: (note: Note) => void
}) {
  const authorNames = new Map(members.map((member) => [member.user_id, member.display_name]))

  if (!isLoading && notes.length === 0) return null

  return (
    <section className="xl:hidden" aria-labelledby="recent-memories-mobile-title">
      <div className="mb-2.5 flex items-center gap-2 px-0.5">
        <Clock3 className="size-3.5 text-primary" />
        <h2 id="recent-memories-mobile-title" className="text-xs font-semibold">
          Recent memories
        </h2>
      </div>
      <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading
          ? [1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[4.5rem] w-[min(15rem,78vw)] shrink-0 animate-pulse snap-start rounded-2xl border bg-muted/80"
              />
            ))
          : notes.slice(0, 6).map((note) => {
              const author = authorNames.get(note.author_id) ?? 'Book member'
              const initials = author
                .split(' ')
                .map((part) => part[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
              const hasVideo = note.media.some((media) => media.media_kind === 'video')
              const hasPhoto = note.media.some((media) => media.media_kind === 'image')
              const summary =
                note.content.trim() || (hasVideo ? 'Video memory' : hasPhoto ? 'Photo memory' : 'A new memory')

              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onOpen(note)}
                  className="flex w-[min(15rem,78vw)] shrink-0 snap-start gap-2.5 rounded-2xl border bg-card/90 p-3 text-left shadow-sm backdrop-blur-sm transition-colors active:bg-accent"
                >
                  <Avatar className="size-8 shrink-0 border">
                    <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="truncate font-medium text-foreground/80">{author}</span>
                      <span aria-hidden>·</span>
                      <span className="shrink-0">
                        {note.diary_date === today ? 'Today' : compactDate(note.diary_date)}
                      </span>
                    </span>
                    <span className="mt-1 line-clamp-2 text-xs leading-snug text-foreground/80">{summary}</span>
                  </span>
                </button>
              )
            })}
      </div>
    </section>
  )
}

function RecentMemoriesSidebar({
  notes,
  isLoading,
  members,
  today,
  diaryTimezone,
  onOpen,
}: {
  notes: Note[]
  isLoading: boolean
  members: GroupMemberDetail[]
  today: string
  diaryTimezone?: string
  onOpen: (note: Note) => void
}) {
  const authorNames = new Map(members.map((member) => [member.user_id, member.display_name]))

  return (
    <aside className="sticky top-6 hidden xl:block" aria-label="Recent memories">
      <div className="overflow-hidden rounded-2xl border bg-card/90 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b px-4 py-3.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock3 className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold leading-tight">Recent memories</h2>
            <p className="text-[11px] text-muted-foreground">Latest in this book</p>
          </div>
        </div>

        <div className="p-2">
          {isLoading &&
            [1, 2, 3, 4].map((item) => (
              <div key={item} className="flex gap-2.5 rounded-xl px-2 py-3">
                <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}

          {!isLoading && notes.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Clock3 className="mx-auto mb-2 size-5 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">New memories will appear here.</p>
            </div>
          )}

          {!isLoading &&
            notes.map((note) => {
              const author = authorNames.get(note.author_id) ?? 'Book member'
              const initials = author
                .split(' ')
                .map((part) => part[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
              const hasVideo = note.media.some((media) => media.media_kind === 'video')
              const hasPhoto = note.media.some((media) => media.media_kind === 'image')
              const fallback = hasVideo ? 'Video memory' : hasPhoto ? 'Photo memory' : 'A new memory'
              const summary = note.content.trim() || fallback
              const dateLabel = note.diary_date === today ? 'Today' : compactDate(note.diary_date)

              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onOpen(note)}
                  className="group flex w-full gap-2.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="mt-0.5 size-8 shrink-0 border">
                    <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <span className="max-w-[7.5rem] truncate font-medium text-foreground/80">{author}</span>
                      <span aria-hidden>·</span>
                      <span className="shrink-0">{dateLabel}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-foreground/80 group-hover:text-foreground">
                      {summary}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      {hasPhoto && <ImageIcon className="size-3" aria-label="Includes photos" />}
                      {hasVideo && <Film className="size-3" aria-label="Includes video" />}
                      <span>{formatTimeInZone(note.created_at, diaryTimezone)}</span>
                    </span>
                  </span>
                </button>
              )
            })}
        </div>
      </div>
    </aside>
  )
}

function compactDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}

function NoteImageGrid({ images }: { images: NoteMedia[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null))
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIndex, images.length])

  if (!images.length) return null

  const open = (i: number) => setLightboxIndex(i)
  const close = () => setLightboxIndex(null)
  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null))
  }
  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null))
  }

  const downloadImage = async (url: string, index: number) => {
    const filename = `memory-${index + 1}.jpg`
    try {
      // Load via crossOrigin so canvas can read the pixels
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((res, rej) => {
        img.onload = () => res()
        img.onerror = rej
        img.src = url
      })
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      canvas.toBlob(
        (blob) => {
          if (!blob) return
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = filename
          a.click()
          URL.revokeObjectURL(a.href)
        },
        'image/jpeg',
        0.92,
      )
    } catch {
      // CORS blocked — fall back to direct download (keeps original format)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.target = '_blank'
      a.click()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 50) return // too short — treat as tap
    if (dx < 0)
      setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null)) // swipe left → next
    else setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null)) // swipe right → prev
  }

  const n = images.length
  const MAX_SHOWN = 4
  const shown = images.slice(0, MAX_SHOWN)
  const overflow = n - MAX_SHOWN

  const imgBtn = (img: NoteMedia, i: number, cls: string, showOverlay = false) => (
    <button
      key={img.id}
      type="button"
      onClick={() => open(i)}
      className={cn('relative overflow-hidden bg-muted focus:outline-none group', cls)}
    >
      <OfflineImage
        src={resolveMediaUrl(img.media_url)}
        alt=""
        className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
      {showOverlay && overflow > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-white font-bold text-2xl select-none">
          +{overflow + 1}
        </div>
      )}
    </button>
  )

  let grid: React.ReactNode
  if (n === 1) {
    grid = (
      <button
        type="button"
        onClick={() => open(0)}
        className="group w-full overflow-hidden rounded-xl focus:outline-none"
      >
        <OfflineImage
          src={resolveMediaUrl(images[0].media_url)}
          alt=""
          className="w-full max-h-72 object-contain rounded-xl bg-muted transition-opacity group-hover:opacity-95"
        />
      </button>
    )
  } else if (n === 2) {
    grid = (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden h-44">
        {shown.map((img, i) => imgBtn(img, i, 'w-full h-full'))}
      </div>
    )
  } else if (n === 3) {
    grid = (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden h-52">
        {imgBtn(images[0], 0, 'row-span-2 h-full')}
        {imgBtn(images[1], 1, 'h-full')}
        {imgBtn(images[2], 2, 'h-full')}
      </div>
    )
  } else {
    grid = (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden h-52">
        {shown.map((img, i) => imgBtn(img, i, 'h-full', i === MAX_SHOWN - 1))}
      </div>
    )
  }

  return (
    <>
      {grid}

      {lightboxIndex !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={close}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Close */}
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                void downloadImage(resolveMediaUrl(images[lightboxIndex].media_url), lightboxIndex)
              }}
              className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Download as JPEG"
            >
              <Download className="size-5" />
            </button>

            {/* Counter */}
            {images.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-sm text-white tabular-nums">
                {lightboxIndex + 1} / {images.length}
              </div>
            )}

            {/* Prev */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}

            {/* Image */}
            <OfflineImage
              src={resolveMediaUrl(images[lightboxIndex].media_url)}
              alt=""
              className="max-h-[88vh] max-w-[88vw] rounded-lg object-contain select-none"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Next */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={next}
                className="absolute right-3 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="size-6" />
              </button>
            )}

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLightboxIndex(i)
                    }}
                    className={cn(
                      'size-10 overflow-hidden rounded-md border-2 transition-all',
                      i === lightboxIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-90',
                    )}
                  >
                    <OfflineImage src={resolveMediaUrl(img.media_url)} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}

function NoteMediaGallery({ media }: { media: NoteMedia[] }) {
  const images = media.filter((item) => item.media_kind === 'image')
  const videos = media.filter((item) => item.media_kind === 'video')

  return (
    <div className="space-y-3">
      <NoteImageGrid images={images} />
      {videos.map((video) => (
        <div key={video.id} className="overflow-hidden rounded-xl border bg-black">
          <video
            src={resolveMediaUrl(video.media_url)}
            controls
            playsInline
            preload="metadata"
            className="max-h-[32rem] w-full bg-black object-contain"
          >
            Your device cannot play this video memory.
          </video>
          <div className="flex items-center gap-1.5 bg-card/95 px-3 py-2 text-[11px] text-muted-foreground">
            <Film className="size-3.5" />
            Video memory
            {video.duration_seconds && <span>· {formatVideoDuration(video.duration_seconds)}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function formatVideoDuration(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds))
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`
}

function NoteCard({
  note,
  isOwn,
  currentUserId,
  diaryTimezone,
  members,
  isTarget,
}: {
  note: Note
  isOwn: boolean
  currentUserId?: string
  diaryTimezone?: string
  members: GroupMemberDetail[]
  isTarget?: boolean
}) {
  const [replyContent, setReplyContent] = useState('')
  const [showReply, setShowReply] = useState(false)
  const replyInputRef = useRef<HTMLTextAreaElement>(null)
  const isWaitingForSync = note.sync_status === 'pending' || note.sync_status === 'failed'
  const { data: reactions } = useReactions(note.id, !isWaitingForSync)
  const { data: replies } = useReplies(note.id, !isWaitingForSync)
  const { mutate: upsertReaction } = useUpsertReaction(note.id)
  const { mutate: removeReaction } = useRemoveReaction(note.id)
  const { mutate: createReply, isPending: isReplying } = useCreateReply(note.id)

  const shareNote = async () => {
    if (!navigator.share) return
    try {
      const shareData: ShareData = { text: note.content || '' }

      // Try to include attached media (Web Share Level 2)
      if ((note.media?.length ?? 0) > 0 && navigator.canShare) {
        const files = (
          await Promise.all(
            note.media.map(async (media, i) => {
              try {
                const res = await fetch(resolveMediaUrl(media.media_url))
                const blob = await res.blob()
                const extension =
                  media.media_kind === 'video' ? (media.mime_type === 'video/mp4' ? 'mp4' : 'webm') : 'jpg'
                return new File([blob], `memory-${i + 1}.${extension}`, {
                  type: blob.type,
                })
              } catch {
                return null
              }
            }),
          )
        ).filter(Boolean) as File[]

        if (files.length > 0 && navigator.canShare({ files })) {
          shareData.files = files
        }
      }

      await navigator.share(shareData)
    } catch (err) {
      // User dismissed the share sheet — not an error
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Could not open share sheet')
      }
    }
  }

  const author = members.find((m) => m.user_id === note.author_id)
  const authorName = isOwn ? 'You' : author?.display_name || 'Unknown member'
  const initials = authorName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const myReaction = reactions?.find((r) => r.user_id === currentUserId)
  const reactionCounts = (reactions ?? []).reduce(
    (acc, r) => {
      acc[r.reaction_type] = (acc[r.reaction_type] ?? 0) + 1
      return acc
    },
    {} as Partial<Record<ReactionType, number>>,
  )

  const handleReply = () => {
    if (!replyContent.trim()) return
    createReply(replyContent.trim(), {
      onSuccess: () => {
        setReplyContent('')
        setShowReply(false)
        toast.success('Reply added')
      },
      onError: (err) => toast.error(err.message),
    })
  }

  const memoryPreview = note.content.trim()
    ? note.content.trim()
    : note.media.some((media) => media.media_kind === 'video')
      ? 'Video memory'
      : note.media.some((media) => media.media_kind === 'image')
        ? 'Photo memory'
        : 'Memory'

  const openReply = () => {
    setShowReply(true)
    window.requestAnimationFrame(() => replyInputRef.current?.focus())
  }

  return (
    <div id={`note-${note.id}`} className={cn('scroll-mt-24 flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && (
        <Avatar className="mt-1 size-8 shrink-0">
          <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
            {initials || '?'}
          </AvatarFallback>
        </Avatar>
      )}

      <article
        className={cn(
          'max-w-[94%] rounded-2xl border shadow-sm transition-shadow hover:shadow-md backdrop-blur-sm sm:max-w-[84%]',
          isOwn ? 'rounded-tr-md border-primary/30 bg-[var(--own-note-bg)]' : 'rounded-tl-md bg-card/90',
          isTarget && 'ring-2 ring-primary/50',
        )}
      >
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xs font-semibold">{authorName}</span>
            <span className="text-[11px] text-muted-foreground">{formatTime(note.created_at)}</span>
            {diaryTimezone && (
              <span className="text-[11px] text-muted-foreground">
                Book {formatTimeInZone(note.created_at, diaryTimezone)}
              </span>
            )}
            {note.is_edited && <span className="text-[10px] italic text-muted-foreground">edited</span>}
            {isWaitingForSync && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                  note.sync_status === 'failed'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                )}
              >
                {note.sync_status === 'failed' ? (
                  <CircleAlert className="size-3" />
                ) : (
                  <CloudUpload className="size-3" />
                )}
                {note.sync_status === 'failed' ? 'Needs retry' : 'Waiting to sync'}
              </span>
            )}
          </div>

          {note.content && (
            <p
              className={cn(
                'whitespace-pre-wrap text-sm leading-relaxed',
                note.is_deleted && 'italic text-muted-foreground',
              )}
            >
              {note.content}
            </p>
          )}

          {(note.media?.length ?? 0) > 0 && <NoteMediaGallery media={note.media} />}

          {!isWaitingForSync && (
            <div className="flex flex-wrap items-center gap-1.5">
              {Object.entries(reactionCounts).map(([rt, count]) => {
                const selected = myReaction?.reaction_type === rt
                return (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => (selected ? removeReaction() : upsertReaction(rt))}
                    className={cn(
                      'inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs transition-colors hover:border-primary/50',
                      selected && 'border-primary bg-primary/10 text-primary',
                    )}
                  >
                    <span>{reactionEmoji(rt)}</span>
                    {(count ?? 0) > 0 && <span className="font-medium">{count}</span>}
                  </button>
                )
              })}
              <EmojiReactionPicker
                selectedReaction={myReaction?.reaction_type}
                onSelect={(rt) => (myReaction?.reaction_type === rt ? removeReaction() : upsertReaction(rt))}
              />
            </div>
          )}

          {!isWaitingForSync && (replies?.length ?? 0) > 0 && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <MessageCircle className="size-3.5" />
                {replies?.length} {replies?.length === 1 ? 'reply' : 'replies'}
              </div>
              {replies?.map((reply) => {
                const replyIsOwn = reply.author_id === currentUserId
                const replyAuthor = members.find((m) => m.user_id === reply.author_id)
                return (
                  <div
                    key={reply.id}
                    className={cn(
                      'rounded-lg px-3 py-2 text-xs',
                      replyIsOwn ? 'ml-6 bg-primary/15' : 'mr-6 bg-muted/80',
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-semibold">
                        {replyIsOwn ? 'You' : replyAuthor?.display_name || 'Unknown member'}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{formatTime(reply.created_at)}</span>
                    </div>
                    <p className={cn('whitespace-pre-wrap', reply.is_deleted && 'italic text-muted-foreground')}>
                      {reply.content}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {!isWaitingForSync && (
            <div className="border-t pt-3">
              {showReply ? (
                <div className="space-y-2.5">
                  <div className="flex overflow-hidden rounded-xl border bg-muted/55 text-xs">
                    <span className="w-1 shrink-0 bg-primary" aria-hidden />
                    <div className="min-w-0 px-3 py-2">
                      <p className="font-semibold text-primary">Replying to {authorName}</p>
                      <p className="mt-0.5 line-clamp-2 text-muted-foreground">{memoryPreview}</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <Textarea
                      ref={replyInputRef}
                      autoFocus
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply()
                        if (e.key === 'Escape') {
                          setShowReply(false)
                          setReplyContent('')
                        }
                      }}
                      placeholder="Write your reply…"
                      aria-label={`Reply to ${authorName}'s memory`}
                      className="min-h-11 resize-none rounded-xl bg-background/80 px-3 py-2.5 text-sm"
                    />
                    <Button
                      size="icon"
                      className="size-11 shrink-0 rounded-xl"
                      disabled={!replyContent.trim() || isReplying}
                      onClick={handleReply}
                      aria-label="Send reply"
                      title="Send reply"
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-0.5">
                    <p className="hidden text-[10px] text-muted-foreground sm:block">Ctrl/⌘ + Enter to send</p>
                    <button
                      type="button"
                      className="ml-auto text-xs text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => {
                        setShowReply(false)
                        setReplyContent('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={openReply}
                    className="flex min-h-8 items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={`Reply to ${authorName}'s memory`}
                  >
                    <MessageCircle className="size-3.5" />
                    Reply
                    {(replies?.length ?? 0) > 0 && <span className="tabular-nums">{replies?.length}</span>}
                  </button>
                  {'share' in navigator && (
                    <button
                      type="button"
                      onClick={() => void shareNote()}
                      className="flex min-h-8 items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Share2 className="size-3.5" />
                      Share
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {isWaitingForSync && (
            <div className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
              <CloudUpload className="size-3.5 shrink-0" />
              This memory is safely stored on this device and will upload automatically.
            </div>
          )}
        </div>
      </article>
    </div>
  )
}

function EmojiReactionPicker({
  selectedReaction,
  onSelect,
}: {
  selectedReaction?: string
  onSelect: (rt: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [customEmoji, setCustomEmoji] = useState('')

  const handleCustomSubmit = () => {
    const value = customEmoji.trim()
    if (!value) return
    onSelect(value)
    setCustomEmoji('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs transition-colors hover:border-primary/50',
          selectedReaction && 'border-primary/40',
        )}
      >
        <Plus className="size-3" />
        React
      </button>

      {open && (
        <div className="absolute bottom-9 left-0 z-20 w-64 rounded-lg border bg-card/95 backdrop-blur-sm p-3 shadow-lg">
          <div className="grid grid-cols-6 gap-1.5">
            {DEFAULT_REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onSelect(emoji)
                  setOpen(false)
                }}
                className={cn(
                  'flex size-8 items-center justify-center rounded-md text-lg hover:bg-accent',
                  selectedReaction === emoji && 'bg-primary/10 ring-1 ring-primary/30',
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value.slice(0, 16))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCustomSubmit()
              }}
              placeholder="Paste emoji"
              className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background/70 px-2 text-xs outline-none focus:border-ring"
            />
            <Button size="sm" type="button" onClick={handleCustomSubmit} disabled={!customEmoji.trim()}>
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
