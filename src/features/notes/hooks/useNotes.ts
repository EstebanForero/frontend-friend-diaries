import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notesApi, type CreateNotePayload, type UpdateNotePayload } from '../api/notes.api'

export const noteKeys = {
  all: ['notes'] as const,
  byDate: (groupId: string, date: string) => [...noteKeys.all, groupId, date] as const,
  recent: (groupId: string) => [...noteKeys.all, 'recent', groupId] as const,
  calendar: (groupId: string, month: string, authorId?: string) =>
    [...noteKeys.all, 'calendar', groupId, month, authorId ?? 'all'] as const,
}

export function useRecentNotes(groupId: string) {
  return useQuery({
    queryKey: noteKeys.recent(groupId),
    queryFn: () => notesApi.recent(groupId),
    enabled: !!groupId,
    staleTime: 30_000,
  })
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
      void qc.invalidateQueries({ queryKey: noteKeys.recent(groupId) })
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
      void qc.invalidateQueries({ queryKey: noteKeys.recent(groupId) })
    },
  })
}

export function useCalendarSummary(groupId: string, month: string, authorId?: string) {
  return useQuery({
    queryKey: noteKeys.calendar(groupId, month, authorId),
    queryFn: () => notesApi.calendarSummary(groupId, month, authorId),
    enabled: !!groupId && !!month,
    staleTime: 60_000,
  })
}

export function useDeleteNote(groupId: string, date: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => notesApi.delete(noteId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: noteKeys.byDate(groupId, date) })
      void qc.invalidateQueries({ queryKey: noteKeys.recent(groupId) })
    },
  })
}

export function useAdjacentDates(groupId: string, date: string, authorId?: string) {
  return useQuery({
    queryKey: [...noteKeys.all, 'adjacent', groupId, date, authorId ?? 'all'],
    queryFn: () => notesApi.adjacent(groupId, date, authorId),
    enabled: !!groupId && !!date,
    staleTime: 30_000,
  })
}

export function useStreak(groupId: string, authorId?: string) {
  return useQuery({
    queryKey: ['streak', groupId, authorId ?? 'me'],
    queryFn: () => notesApi.streak(groupId, authorId),
    enabled: !!groupId && !!authorId,
    staleTime: 60_000,
  })
}
