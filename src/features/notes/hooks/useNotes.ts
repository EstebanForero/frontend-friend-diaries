import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notesApi, type CreateNotePayload, type UpdateNotePayload } from '../api/notes.api'

export const noteKeys = {
  all: ['notes'] as const,
  byDate: (groupId: string, date: string) => [...noteKeys.all, groupId, date] as const,
}

export function useNotesByDate(groupId: string, date: string) {
  return useQuery({
    queryKey: noteKeys.byDate(groupId, date),
    queryFn: () => notesApi.listByDate(groupId, date),
    enabled: !!groupId && !!date,
  })
}

export function useCreateNote(groupId: string, date: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateNotePayload) => notesApi.create(groupId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: noteKeys.byDate(groupId, date) })
    },
  })
}

export function useUpdateNote(groupId: string, date: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ noteId, payload }: { noteId: string; payload: UpdateNotePayload }) =>
      notesApi.update(noteId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: noteKeys.byDate(groupId, date) })
    },
  })
}

export function useDeleteNote(groupId: string, date: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => notesApi.delete(noteId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: noteKeys.byDate(groupId, date) })
    },
  })
}
