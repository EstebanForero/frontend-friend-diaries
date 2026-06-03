import { createFileRoute } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, MessageCircle, Plus, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useGroup, useGroupMembers } from '@/features/groups/hooks/useGroups'
import { useNotesByDate, useCreateNote } from '@/features/notes/hooks/useNotes'
import { useAuthStore } from '@/store/auth.store'
import { InviteDialog } from '@/features/groups/components/InviteDialog'
import { MembersSheet } from '@/features/groups/components/MembersSheet'
import { formatDate, formatTime, formatTimeInZone, isToday, todayDateString } from '@/lib/utils'
import { useCreateReply, useReplies } from '@/features/replies/hooks/useReplies'
import {
  useReactions,
  useRemoveReaction,
  useUpsertReaction,
} from '@/features/reactions/hooks/useReactions'
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

function DiaryPage() {
  const { groupId } = Route.useParams()
  const search = Route.useSearch()
  const { user } = useAuthStore()
  const [date, setDate] = useState(search.date ?? todayDateString())
  const [content, setContent] = useState('')

  const { data: group } = useGroup(groupId)
  const { data: members } = useGroupMembers(groupId)
  const { data: notes, isLoading } = useNotesByDate(groupId, date)
  const { mutate: createNote, isPending: isCreating } = useCreateNote(groupId, date)

  const canWrite = isToday(date)
  const isAtToday = date >= todayDateString()

  useEffect(() => {
    if (search.date) setDate(search.date)
  }, [search.date])

  useEffect(() => {
    if (!search.noteId || isLoading) return
    document.getElementById(`note-${search.noteId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [search.noteId, isLoading, notes])

  const handleSubmit = () => {
    if (!content.trim()) return
    createNote(
      { content: content.trim(), date },
      {
        onSuccess: () => setContent(''),
        onError: (err) => toast.error(err.message),
      },
    )
  }

  const prevDay = () => {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    setDate(d.toISOString().split('T')[0])
  }

  const nextDay = () => {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    const next = d.toISOString().split('T')[0]
    if (next <= todayDateString()) setDate(next)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold leading-none">{group?.name ?? '…'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{formatDate(date)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <MembersSheet groupId={groupId} groupName={group?.name ?? ''} />
          <InviteDialog groupId={groupId} />
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" onClick={prevDay}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={nextDay}
              disabled={isAtToday}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Notes */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl border bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {notes?.map((note) => (
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
          {(notes?.length ?? 0) === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {canWrite
                  ? 'Nothing written yet today. How are you feeling?'
                  : 'No entries on this day.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Write box */}
      {canWrite && (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
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
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || isCreating}
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

  const author = members.find((member) => member.user_id === note.author_id)
  const authorName = isOwn ? 'You' : author?.display_name || 'Unknown member'
  const initials = authorName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const myReaction = reactions?.find((reaction) => reaction.user_id === currentUserId)
  const reactionCounts = (reactions ?? []).reduce(
    (counts, reaction) => {
      counts[reaction.reaction_type] = (counts[reaction.reaction_type] ?? 0) + 1
      return counts
    },
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
          'max-w-[94%] rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md sm:max-w-[84%]',
          isOwn ? 'rounded-tr-md border-primary/20 bg-primary/5' : 'rounded-tl-md',
          isTarget && 'ring-2 ring-primary/50',
        )}
      >
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xs font-semibold">{authorName}</span>
            <span className="text-[11px] text-muted-foreground">
              {formatTime(note.created_at)}
            </span>
            {diaryTimezone && (
              <span className="text-[11px] text-muted-foreground">
                Diary {formatTimeInZone(note.created_at, diaryTimezone)}
              </span>
            )}
            {note.is_edited && (
              <span className="text-[10px] italic text-muted-foreground">edited</span>
            )}
          </div>

          <p
            className={cn(
              'whitespace-pre-wrap text-sm leading-relaxed',
              note.is_deleted && 'italic text-muted-foreground',
            )}
          >
            {note.content}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            {Object.entries(reactionCounts).map(([reactionType, count]) => {
              const selected = myReaction?.reaction_type === reactionType
              const safeCount = count ?? 0
              return (
                <button
                  key={reactionType}
                  type="button"
                  onClick={() =>
                    selected ? removeReaction() : upsertReaction(reactionType)
                  }
                  className={cn(
                    'inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs transition-colors hover:border-primary/50',
                    selected && 'border-primary bg-primary/10 text-primary',
                  )}
                  title={reactionType}
                >
                  <span>{reactionEmoji(reactionType)}</span>
                  {safeCount > 0 && <span className="font-medium">{safeCount}</span>}
                </button>
              )
            })}
            <EmojiReactionPicker
              selectedReaction={myReaction?.reaction_type}
              onSelect={(reactionType) =>
                myReaction?.reaction_type === reactionType ? removeReaction() : upsertReaction(reactionType)
              }
            />
          </div>

          {(replies?.length ?? 0) > 0 && (
            <div className="space-y-2 border-t pt-3">
              {replies?.map((reply) => {
                const replyIsOwn = reply.author_id === currentUserId
                const replyAuthor = members.find((member) => member.user_id === reply.author_id)
                return (
                  <div
                    key={reply.id}
                    className={cn(
                      'rounded-lg px-3 py-2 text-xs',
                      replyIsOwn ? 'ml-6 bg-primary/10' : 'mr-6 bg-muted',
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
              onChange={(event) => setReplyContent(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) handleReply()
              }}
              placeholder="Write a comment"
              className="min-h-9 resize-none rounded-lg bg-background px-3 py-2 text-xs"
            />
            <Button
              size="icon"
              className="size-9 shrink-0"
              disabled={!replyContent.trim() || isReplying}
              onClick={handleReply}
              title="Comment"
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
  onSelect: (reactionType: string) => void
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
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs transition-colors hover:border-primary/50',
          selectedReaction && 'border-primary/40',
        )}
        title="Add reaction"
      >
        <Plus className="size-3" />
        React
      </button>

      {open && (
        <div className="absolute bottom-9 left-0 z-20 w-64 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg">
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
              onChange={(event) => setCustomEmoji(event.target.value.slice(0, 16))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleCustomSubmit()
              }}
              placeholder="Paste emoji"
              className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
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
