import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { notesApi } from '@/features/notes/api/notes.api'
import { formatDate, formatTime, resolveMediaUrl } from '@/lib/utils'

export const Route = createFileRoute('/share/note/$noteShareId')({
  component: SharedNotePage,
})

function SharedNotePage() {
  const { noteShareId } = Route.useParams()

  const {
    data: note,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['share', 'note', noteShareId],
    queryFn: () => notesApi.getByShareToken(noteShareId),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading note...</p>
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="font-medium">You do not have permission to view this note.</p>
          <p className="text-sm text-muted-foreground">
            This link may have expired or you are not a member of the Memory Book.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-4">
        <p className="text-xs text-muted-foreground text-center">Shared memory from Friend Diaries</p>
        <div className="rounded-xl border p-6 space-y-3">
          <p className="text-xs text-muted-foreground">
            {formatDate(note.diary_date)} · {formatTime(note.created_at)}
            {note.is_edited && ' · Edited'}
          </p>
          {note.content && <p className="text-base whitespace-pre-wrap">{note.content}</p>}
          {note.media?.map((media) =>
            media.media_kind === 'video' ? (
              <video
                key={media.id}
                src={resolveMediaUrl(media.media_url)}
                controls
                playsInline
                className="w-full rounded-xl bg-black"
              />
            ) : (
              <img
                key={media.id}
                src={resolveMediaUrl(media.media_url)}
                alt="Shared memory"
                className="w-full rounded-xl"
              />
            ),
          )}
        </div>
      </div>
    </div>
  )
}
