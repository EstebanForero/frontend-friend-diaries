import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Plus, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useGroup } from '@/features/groups/hooks/useGroups'
import { useNotesByDate, useCreateNote } from '@/features/notes/hooks/useNotes'
import { useAuthStore } from '@/store/auth.store'
import { formatDate, isToday, todayDateString } from '@/lib/utils'
import type { Note } from '@/types'
import { formatTime } from '@/lib/utils'

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{group?.name ?? 'Loading...'}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={prevDay}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextDay}
            disabled={date >= todayDateString()}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {notes?.map((note) => (
            <NoteCard key={note.id} note={note} currentUserId={user?.id ?? ''} groupId={groupId} date={date} />
          ))}

          {notes?.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              {canWrite ? 'No notes yet. Be the first to write today.' : 'No notes on this day.'}
            </p>
          )}
        </div>
      )}

      {canWrite && (
        <div className="rounded-xl border p-4 space-y-3">
          <Textarea
            placeholder="What's on your mind today?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="resize-none min-h-[100px] border-0 focus-visible:ring-0 p-0"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isCreating}
              size="sm"
            >
              <Send className="size-4" />
              {isCreating ? 'Posting...' : 'Post note'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function NoteCard({ note, currentUserId, groupId, date }: {
  note: Note
  currentUserId: string
  groupId: string
  date: string
}) {
  return (
    <div className="rounded-xl border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {formatTime(note.created_at)}
          {note.is_edited && ' · Edited'}
        </span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
    </div>
  )
}
