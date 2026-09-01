import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reactionsApi } from '../api/reactions.api'
import type { ReactionType } from '@/types'

export const reactionKeys = {
  byNote: (noteId: string) => ['reactions', noteId] as const,
}

export function useReactions(noteId: string, enabled = true) {
  return useQuery({
    queryKey: reactionKeys.byNote(noteId),
    queryFn: () => reactionsApi.list(noteId),
    enabled: !!noteId && enabled,
  })
}

export function useUpsertReaction(noteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reactionType: ReactionType) => reactionsApi.upsert(noteId, reactionType),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reactionKeys.byNote(noteId) })
    },
  })
}

export function useRemoveReaction(noteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => reactionsApi.remove(noteId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reactionKeys.byNote(noteId) })
    },
  })
}
