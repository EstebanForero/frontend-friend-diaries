import { createFileRoute } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useGroup } from '@/features/groups/hooks/useGroups'
import { useNotesByDate, useCreateNote } from '@/features/notes/hooks/useNotes'
import { useAuthStore } from '@/store/auth.store'
import { InviteDialog } from '@/features/groups/components/InviteDialog'
import { MembersSheet } from '@/features/groups/components/MembersSheet'
import { formatDate, formatTime, isToday, todayDateString } from '@/lib/utils'
import type { Note } from '@/types'

export const Route = createFileRoute('/app/groups/$groupId/')({
  component: DiaryPage,
})

function DiaryPage() {
  const { groupId } = Route.useParams()
  const { user } = useAuthStore()
  const [date, setDate] = useState(todayDateString())
  const [content, setContent] = useState('')

  const { data: group } = useGroup(groupId)
  const { data: notes, isLoading } = useNotesByDate(groupId, date)
  const { mutate: createNote, isPending: isCreating } = useCreateNote(groupId, date)

  const canWrite = isToday(date)
  const isAtToday = date >= todayDateString()

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
            <NoteCard key={note.id} note={note} isOwn={note.author_id === user?.id} />
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

function NoteCard({ note, isOwn }: { note: Note; isOwn: boolean }) {
  return (
    <div
      className={`rounded-2xl border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
        isOwn ? 'border-primary/20' : ''
      }`}
    >
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Avatar className="size-7 shrink-0">
          <AvatarFallback
            className={`text-[10px] font-semibold ${
              isOwn ? 'bg-primary/15 text-primary' : 'bg-accent text-accent-foreground'
            }`}
          >
            {isOwn ? 'ME' : '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold">{isOwn ? 'You' : 'Them'}</span>
          <span className="text-xs text-muted-foreground">{formatTime(note.created_at)}</span>
          {note.is_edited && (
            <span className="text-[10px] text-muted-foreground italic">edited</span>
          )}
        </div>
      </div>
      <p
        className={`px-4 pb-4 text-sm leading-relaxed whitespace-pre-wrap ${
          note.is_deleted ? 'italic text-muted-foreground' : ''
        }`}
      >
        {note.content}
      </p>
    </div>
  )
}
