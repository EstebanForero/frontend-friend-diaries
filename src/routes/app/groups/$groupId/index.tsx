import { createFileRoute } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, MessageCircle, Plus, Send, User, CalendarDays } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useGroup, useGroupMembers } from '@/features/groups/hooks/useGroups'
import { useNotesByDate, useCreateNote, useCalendarSummary } from '@/features/notes/hooks/useNotes'
import { useAuthStore } from '@/store/auth.store'
import { InviteDialog } from '@/features/groups/components/InviteDialog'
import { MembersSheet } from '@/features/groups/components/MembersSheet'
import { formatDate, formatTime, formatTimeInZone, isToday, todayDateString } from '@/lib/utils'
import { useCreateReply, useReplies } from '@/features/replies/hooks/useReplies'
import { useReactions, useRemoveReaction, useUpsertReaction } from '@/features/reactions/hooks/useReactions'
import { cn } from '@/lib/utils'
import type { GroupMemberDetail, Note, ReactionType } from '@/types'
import { DEFAULT_REACTION_EMOJIS, reactionEmoji } from '@/types'

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
  const [viewMode, setViewMode] = useState<ViewMode>('mine')
  const [showCalendar, setShowCalendar] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  const { data: group } = useGroup(groupId)
  const { data: members } = useGroupMembers(groupId)
  const { data: notes, isLoading } = useNotesByDate(groupId, date)
  const { mutate: createNote, isPending: isCreating } = useCreateNote(groupId, date)

  const calendarMonth = date.slice(0, 7) // YYYY-MM
  const calendarAuthorId =
    viewMode === 'all' ? undefined :
    viewMode === 'mine' ? user?.id :
    viewMode
  const { data: calendarCounts } = useCalendarSummary(groupId, calendarMonth, calendarAuthorId)

  const canWrite = isToday(date)
  const isAtToday = date >= todayDateString()

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

  // Close calendar on outside click
  useEffect(() => {
    if (!showCalendar) return
    const handler = (e: MouseEvent) => {
      if (!calendarRef.current?.contains(e.target as Node)) setShowCalendar(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCalendar])

  const prevDay = () => {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() - 1)
    setDate(d.toISOString().split('T')[0])
  }

  const nextDay = () => {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    const next = d.toISOString().split('T')[0]
    if (next <= todayDateString()) setDate(next)
  }

  const handleSubmit = () => {
    if (!content.trim()) return
    createNote(
      { content: content.trim(), date },
      { onSuccess: () => setContent(''), onError: (err) => toast.error(err.message) },
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header bubble */}
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-2xl bg-card/95 backdrop-blur-sm border px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold leading-none truncate">{group?.name ?? '…'}</h1>
              <div className="relative mt-1.5" ref={calendarRef}>
                <button
                  type="button"
                  onClick={() => setShowCalendar((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CalendarDays className="size-3 shrink-0" />
                  {formatDate(date)}
                </button>
                {showCalendar && (
                  <div className="absolute left-0 top-6 z-50">
                    <CalendarPicker
                      value={date}
                      onChange={(d) => { setDate(d); setShowCalendar(false) }}
                      onClose={() => setShowCalendar(false)}
                      counts={calendarCounts ?? {}}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="size-7" onClick={prevDay}>
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" onClick={nextDay} disabled={isAtToday}>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
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
          <Textarea
            placeholder="What's on your mind today?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
            className="resize-none min-h-[120px] border-0 focus-visible:ring-0 rounded-none px-5 pt-4 pb-2 text-sm leading-relaxed bg-transparent"
          />
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              <kbd className="font-mono">⌘ Enter</kbd> to post
            </p>
            <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || isCreating} className="gap-1.5">
              <Send className="size-3.5" />
              {isCreating ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </div>
      )}
    </div>
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
  const { data: reactions } = useReactions(note.id)
  const { data: replies } = useReplies(note.id)
  const { mutate: upsertReaction } = useUpsertReaction(note.id)
  const { mutate: removeReaction } = useRemoveReaction(note.id)
  const { mutate: createReply, isPending: isReplying } = useCreateReply(note.id)

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

          <p className={cn('whitespace-pre-wrap text-sm leading-relaxed', note.is_deleted && 'italic text-muted-foreground')}>
            {note.content}
          </p>

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

          <div className="flex items-end gap-2 border-t pt-3">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply() }}
              placeholder="Write a comment"
              className="min-h-9 resize-none rounded-lg bg-background/70 px-3 py-2 text-xs"
            />
            <Button
              size="icon"
              className="size-9 shrink-0"
              disabled={!replyContent.trim() || isReplying}
              onClick={handleReply}
            >
              <MessageCircle className="size-4" />
            </Button>
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
