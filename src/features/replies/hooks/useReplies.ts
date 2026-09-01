import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { repliesApi } from '../api/replies.api'

export const replyKeys = {
  byNote: (noteId: string) => ['replies', noteId] as const,
}

export function useReplies(noteId: string, enabled = true) {
  return useQuery({
    queryKey: replyKeys.byNote(noteId),
    queryFn: () => repliesApi.list(noteId),
    enabled: !!noteId && enabled,
  })
}

export function useCreateReply(noteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => repliesApi.create(noteId, content),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: replyKeys.byNote(noteId) })
    },
  })
}
