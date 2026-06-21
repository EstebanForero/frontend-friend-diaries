import { createFileRoute } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, MessageCircle, Plus, Send, User, CalendarDays, X, ImagePlus, Flame, Bell, Download, RefreshCw, Share2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useGroup, useGroupMembers } from '@/features/groups/hooks/useGroups'
import { useNotesByDate, useCreateNote, useCalendarSummary, useAdjacentDates, useStreak } from '@/features/notes/hooks/useNotes'
import { usePushNotifications } from '@/features/notifications/hooks/usePushNotifications'
import { useAutoMarkNotificationsRead } from '@/features/notifications/hooks/useNotifications'
import { useAuthStore } from '@/store/auth.store'
import { InviteDialog } from '@/features/groups/components/InviteDialog'
import { MembersSheet } from '@/features/groups/components/MembersSheet'
import { formatDate, formatTime, formatTimeInZone, isToday, todayDateString, resolveMediaUrl } from '@/lib/utils'
import { useCreateReply, useReplies } from '@/features/replies/hooks/useReplies'
import { useReactions, useRemoveReaction, useUpsertReaction } from '@/features/reactions/hooks/useReactions'
import { mediaApi } from '@/features/media/api/media.api'
import { cn } from '@/lib/utils'
import type { GroupMemberDetail, Note, NoteImage, ReactionType } from '@/types'
import { DEFAULT_REACTION_EMOJIS, reactionEmoji } from '@/types'

interface PendingImage {
  localUrl: string
  uploadedId?: string
  uploading: boolean
  error?: boolean
}

export const Route = createFileRoute('/app/groups/$groupId/')({
  validateSearch: (search: Record<string, unknown>) => ({
    date: typeof search.date === 'string' ? search.date : undefined,
    noteId: typeof search.noteId === 'string' ? search.noteId : undefined,
  }),
  component: DiaryPage,
})

type ViewMode = 'mine' | 'all' | string // 'mine', 'all', or a member's user_id

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function CalendarPicker({
  value,
  onChange,
  onClose,
  counts = {},
}: {
  value: string
  onChange: (date: string) => void
  onClose: () => void
  counts?: Record<string, number>
}) {
  const today = todayDateString()
  const [month, setMonth] = useState(() => {
    const d = new Date(value + 'T00:00:00')
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const firstDay = new Date(month.year, month.month, 1).getDay()
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate()
  const selectedDate = value

  const prevMonth = () => {
    setMonth((m) =>
      m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 },
    )
  }
  const nextMonth = () => {
    const next = month.month === 11
      ? { year: month.year + 1, month: 0 }
      : { year: month.year, month: month.month + 1 }
    const firstOfNext = `${next.year}-${String(next.month + 1).padStart(2, '0')}-01`
    if (firstOfNext <= today) setMonth(next)
  }

  const isNextDisabled = () => {
    const next = month.month === 11
      ? { year: month.year + 1, month: 0 }
      : { year: month.year, month: month.month + 1 }
    return `${next.year}-${String(next.month + 1).padStart(2, '0')}-01` > today
  }

  const selectDay = (day: number) => {
    const d = `${month.year}-${String(month.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (d <= today) {
      onChange(d)
      onClose()
    }
  }

  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1,
  )

  return (
    <div className="w-72 rounded-2xl border bg-card/95 backdrop-blur-sm shadow-xl p-4">
      {/* Month/year header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
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
                <span className={cn(
                  'mt-0.5 h-1 w-1 rounded-full',
                  isSelected ? 'bg-primary-foreground' : 'bg-primary',
                )} />
              )}
            </button>
          )
        })}
      </div>

      {/* Today shortcut */}
      <div className="mt-3 border-t pt-3">
        <button
          type="button"
          onClick={() => { onChange(today); onClose() }}
          className="w-full text-xs text-center text-primary font-medium hover:underline"
        >
          Go to today
        </button>
      </div>
    </div>
  )
}

function DiaryPage() {
  const { groupId } = Route.useParams()
  const search = Route.useSearch()
  const { user } = useAuthStore()
  const [date, setDate] = useState(search.date ?? todayDateString())
  const [content, setContent] = useState('')
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('mine')
  const [showCalendar, setShowCalendar] = useState(false)
  const dateButtonRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!showCalendar) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (dateButtonRef.current?.contains(target)) return
      setShowCalendar(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCalendar])

  const { data: group } = useGroup(groupId)
  const { data: members } = useGroupMembers(groupId)
  const { data: notes, isLoading, refetch: refetchNotes } = useNotesByDate(groupId, date)
  const { mutate: createNote, isPending: isCreating } = useCreateNote(groupId, date)

  const calendarMonth = date.slice(0, 7) // YYYY-MM
  const calendarAuthorId =
    viewMode === 'all' ? undefined :
    viewMode === 'mine' ? user?.id :
    viewMode
  const { data: calendarCounts } = useCalendarSummary(groupId, calendarMonth, calendarAuthorId)
  const { data: adjacent } = useAdjacentDates(groupId, date, calendarAuthorId)
  const { data: streak } = useStreak(groupId, calendarAuthorId ?? user?.id)
  const { state: pushState, subscribe: subscribePush } = usePushNotifications()

  // Pull-to-refresh
  const pullStartY = useRef<number | null>(null)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handlePullStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollTop === 0) pullStartY.current = e.touches[0].clientY
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

  const canWrite = isToday(date)

  const visibleNotes = (notes ?? []).filter((n) =>
    viewMode === 'mine' ? n.author_id === user?.id :
    viewMode === 'all' ? true :
    n.author_id === viewMode,
  )

  useEffect(() => {
    if (search.date) setDate(search.date)
  }, [search.date])

  useEffect(() => {
    if (!search.noteId || isLoading) return
    document.getElementById(`note-${search.noteId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [search.noteId, isLoading, notes])


  const prevDay = () => { if (adjacent?.prev) setDate(adjacent.prev) }
  const nextDay = () => { if (adjacent?.next) setDate(adjacent.next) }

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Only image files are supported'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB'); return }

    const localUrl = URL.createObjectURL(file)
    const placeholder: PendingImage = { localUrl, uploading: true }
    setPendingImages((prev) => [...prev, placeholder])

    try {
      const { id } = await mediaApi.upload(file)
      setPendingImages((prev) =>
        prev.map((p) => (p.localUrl === localUrl ? { ...p, uploading: false, uploadedId: id } : p)),
      )
    } catch {
      URL.revokeObjectURL(localUrl)
      setPendingImages((prev) => prev.filter((p) => p.localUrl !== localUrl))
      toast.error('Failed to upload image')
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    files.forEach(uploadFile)
    e.target.value = ''
  }

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageFile = Array.from(e.clipboardData.items)
      .find((item) => item.type.startsWith('image/'))
      ?.getAsFile()
    if (imageFile) {
      e.preventDefault()
      void uploadFile(imageFile)
    }
  }, [uploadFile])

  const removePending = (localUrl: string) => {
    URL.revokeObjectURL(localUrl)
    setPendingImages((prev) => prev.filter((p) => p.localUrl !== localUrl))
  }

  const handleSubmit = () => {
    const imageIds = pendingImages.filter((p) => p.uploadedId).map((p) => p.uploadedId!)
    if (!content.trim() && imageIds.length === 0) return
    if (pendingImages.some((p) => p.uploading)) { toast.info('Images are still uploading…'); return }
    createNote(
      { content: content.trim(), date, image_ids: imageIds.length > 0 ? imageIds : undefined },
      {
        onSuccess: () => {
          setContent('')
          pendingImages.forEach((p) => URL.revokeObjectURL(p.localUrl))
          setPendingImages([])
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  return (
    <div
      className="max-w-2xl mx-auto space-y-6"
      onTouchStart={handlePullStart}
      onTouchMove={handlePullMove}
      onTouchEnd={() => void handlePullEnd()}
    >
      {/* Pull-to-refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div className="flex justify-center pt-1 pb-2">
          <div className={cn(
            'flex items-center gap-2 rounded-full bg-card/90 border px-3 py-1.5 text-xs text-muted-foreground shadow-sm',
            isRefreshing && 'text-primary',
          )}>
            <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing…' : 'Release to refresh'}
          </div>
        </div>
      )}
      {/* Header bubble */}
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-2xl bg-card/95 backdrop-blur-sm border px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold leading-none truncate">{group?.name ?? '…'}</h1>
                {(streak?.current ?? 0) > 0 && (
                  <span className={cn(
                    'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold shrink-0',
                    streak?.recoverable
                      ? 'bg-orange-100 text-orange-500 dark:bg-orange-900/30'
                      : 'bg-orange-500/15 text-orange-500',
                  )}>
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
                    const r = dateButtonRef.current?.getBoundingClientRect()
                    if (r) setCalendarPos({ top: r.bottom + 6, left: r.left })
                    setShowCalendar((v) => !v)
                  }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CalendarDays className="size-3 shrink-0" />
                  {formatDate(date)}
                </button>
              </div>
              {showCalendar && createPortal(
                <div
                  className="fixed z-[9999]"
                  style={{ top: calendarPos.top, left: calendarPos.left }}
                >
                  <CalendarPicker
                    value={date}
                    onChange={(d) => { setDate(d); setShowCalendar(false) }}
                    onClose={() => setShowCalendar(false)}
                    counts={calendarCounts ?? {}}
                  />
                </div>,
                document.body,
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="size-7" onClick={prevDay} disabled={!adjacent?.prev}>
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" onClick={nextDay} disabled={!adjacent?.next}>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {pushState === 'unsubscribed' && (
            <Button variant="ghost" size="icon" className="size-9" onClick={() => void subscribePush()} title="Enable push notifications">
              <Bell className="size-4" />
            </Button>
          )}
          {pushState === 'subscribed' && (
            <Bell className="size-4 text-primary" />
          )}
          <MembersSheet groupId={groupId} groupName={group?.name ?? ''} />
          <InviteDialog groupId={groupId} />
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
          My timeline
        </button>
        {(members ?? [])
          .filter((m) => m.user_id !== user?.id)
          .map((m) => {
            const initials = m.display_name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)
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
        {/* Our timeline — all members */}
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
            Our timeline
          </button>
        )}
      </div>

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
                  ? 'Nothing written yet today. How are you feeling?'
                  : viewMode === 'mine'
                  ? 'No entries from you on this day.'
                  : viewMode === 'all'
                  ? 'No entries on this day.'
                  : 'No entries from this person on this day.'}
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
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Textarea
            placeholder="What's on your mind today?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
            onPaste={handlePaste}
            className="resize-none min-h-[120px] border-0 focus-visible:ring-0 rounded-none px-5 pt-4 pb-2 text-sm leading-relaxed bg-transparent"
            onFocus={(e) => e.currentTarget.closest('.rounded-2xl')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
          />
          {pendingImages.length > 0 && (
            <div className="flex flex-wrap gap-2 px-5 pb-3">
              {pendingImages.map((img) => (
                <div key={img.localUrl} className="relative size-20 shrink-0 rounded-lg overflow-hidden border bg-muted">
                  <img src={img.localUrl} alt="" className="size-full object-cover" />
                  {img.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  )}
                  {!img.uploading && (
                    <button
                      type="button"
                      onClick={() => removePending(img.localUrl)}
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
                <span className="hidden sm:inline">Photo</span>
              </button>
              <p className="text-xs text-muted-foreground hidden sm:block">
                · <kbd className="font-mono">⌘ Enter</kbd> to post
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={(!content.trim() && pendingImages.length === 0) || isCreating || pendingImages.some((p) => p.uploading)}
              className="gap-1.5"
            >
              <Send className="size-3.5" />
              {isCreating ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function NoteImageGrid({ images }: { images: NoteImage[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => i !== null ? (i - 1 + images.length) % images.length : null)
      if (e.key === 'ArrowRight') setLightboxIndex((i) => i !== null ? (i + 1) % images.length : null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIndex, images.length])

  if (!images.length) return null

  const open = (i: number) => setLightboxIndex(i)
  const close = () => setLightboxIndex(null)
  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setLightboxIndex((i) => i !== null ? (i - 1 + images.length) % images.length : null) }
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setLightboxIndex((i) => i !== null ? (i + 1) % images.length : null) }

  const downloadImage = async (url: string, index: number) => {
    const filename = `diary-${index + 1}.jpg`
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
      canvas.toBlob((blob) => {
        if (!blob) return
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = filename
        a.click()
        URL.revokeObjectURL(a.href)
      }, 'image/jpeg', 0.92)
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
    if (dx < 0) setLightboxIndex((i) => i !== null ? (i + 1) % images.length : null) // swipe left → next
    else setLightboxIndex((i) => i !== null ? (i - 1 + images.length) % images.length : null) // swipe right → prev
  }

  const n = images.length
  const MAX_SHOWN = 4
  const shown = images.slice(0, MAX_SHOWN)
  const overflow = n - MAX_SHOWN

  const imgBtn = (img: NoteImage, i: number, cls: string, showOverlay = false) => (
    <button
      key={img.id}
      type="button"
      onClick={() => open(i)}
      className={cn('relative overflow-hidden bg-muted focus:outline-none group', cls)}
    >
      <img src={resolveMediaUrl(img.media_url)} alt="" className="size-full object-cover transition-transform duration-200 group-hover:scale-105" />
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
      <button type="button" onClick={() => open(0)} className="group w-full overflow-hidden rounded-xl focus:outline-none">
        <img
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

      {lightboxIndex !== null && createPortal(
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
            onClick={(e) => { e.stopPropagation(); void downloadImage(resolveMediaUrl(images[lightboxIndex].media_url), lightboxIndex) }}
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
          <img
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
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i) }}
                  className={cn(
                    'size-10 overflow-hidden rounded-md border-2 transition-all',
                    i === lightboxIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-90',
                  )}
                >
                  <img src={resolveMediaUrl(img.media_url)} alt="" className="size-full object-cover" />
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
  const { data: reactions } = useReactions(note.id)
  const { data: replies } = useReplies(note.id)
  const { mutate: upsertReaction } = useUpsertReaction(note.id)
  const { mutate: removeReaction } = useRemoveReaction(note.id)
  const { mutate: createReply, isPending: isReplying } = useCreateReply(note.id)

  const shareNote = async () => {
    if (!navigator.share) return
    try {
      const shareData: ShareData = { text: note.content || '' }

      // Try to include images (Web Share Level 2)
      if ((note.images?.length ?? 0) > 0 && navigator.canShare) {
        const files = (await Promise.all(
          note.images.map(async (img, i) => {
            try {
              const res = await fetch(resolveMediaUrl(img.media_url))
              const blob = await res.blob()
              return new File([blob], `diary-image-${i + 1}.jpg`, { type: blob.type })
            } catch { return null }
          })
        )).filter(Boolean) as File[]

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
  const initials = authorName.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)

  const myReaction = reactions?.find((r) => r.user_id === currentUserId)
  const reactionCounts = (reactions ?? []).reduce(
    (acc, r) => { acc[r.reaction_type] = (acc[r.reaction_type] ?? 0) + 1; return acc },
    {} as Partial<Record<ReactionType, number>>,
  )

  const handleReply = () => {
    if (!replyContent.trim()) return
    createReply(replyContent.trim(), {
      onSuccess: () => setReplyContent(''),
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <div
      id={`note-${note.id}`}
      className={cn('scroll-mt-24 flex gap-2', isOwn ? 'justify-end' : 'justify-start')}
    >
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
          isOwn
            ? 'rounded-tr-md border-primary/30 bg-[var(--own-note-bg)]'
            : 'rounded-tl-md bg-card/90',
          isTarget && 'ring-2 ring-primary/50',
        )}
      >
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xs font-semibold">{authorName}</span>
            <span className="text-[11px] text-muted-foreground">{formatTime(note.created_at)}</span>
            {diaryTimezone && (
              <span className="text-[11px] text-muted-foreground">
                Diary {formatTimeInZone(note.created_at, diaryTimezone)}
              </span>
            )}
            {note.is_edited && <span className="text-[10px] italic text-muted-foreground">edited</span>}
          </div>

          {note.content && (
            <p className={cn('whitespace-pre-wrap text-sm leading-relaxed', note.is_deleted && 'italic text-muted-foreground')}>
              {note.content}
            </p>
          )}

          {(note.images?.length ?? 0) > 0 && (
            <NoteImageGrid images={note.images} />
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {Object.entries(reactionCounts).map(([rt, count]) => {
              const selected = myReaction?.reaction_type === rt
              return (
                <button
                  key={rt}
                  type="button"
                  onClick={() => selected ? removeReaction() : upsertReaction(rt)}
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
              onSelect={(rt) => myReaction?.reaction_type === rt ? removeReaction() : upsertReaction(rt)}
            />
          </div>

          {(replies?.length ?? 0) > 0 && (
            <div className="space-y-2 border-t pt-3">
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
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatTime(reply.created_at)}
                      </span>
                    </div>
                    <p className={cn('whitespace-pre-wrap', reply.is_deleted && 'italic text-muted-foreground')}>
                      {reply.content}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          <div className="border-t pt-3">
            {showReply ? (
              <div className="flex items-end gap-2">
                <Textarea
                  autoFocus
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply()
                    if (e.key === 'Escape') { setShowReply(false); setReplyContent('') }
                  }}
                  placeholder="Write a comment… (⌘ Enter to post)"
                  className="min-h-9 resize-none rounded-lg bg-background/70 px-3 py-2 text-xs"
                />
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="icon" className="size-8" disabled={!replyContent.trim() || isReplying} onClick={handleReply}>
                    <Send className="size-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="size-8" onClick={() => { setShowReply(false); setReplyContent('') }}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowReply(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle className="size-3.5" />
                  Comment
                </button>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    type="button"
                    onClick={() => void shareNote()}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Share2 className="size-3.5" />
                    Share
                  </button>
                )}
              </div>
            )}
          </div>
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
                onClick={() => { onSelect(emoji); setOpen(false) }}
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
              onKeyDown={(e) => { if (e.key === 'Enter') handleCustomSubmit() }}
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
