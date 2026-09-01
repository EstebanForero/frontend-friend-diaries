import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notesApi, type CreateNotePayload, type UpdateNotePayload } from '../api/notes.api'
import { useAuthStore } from '@/store/auth.store'
import { mergePendingNotes, queueNoteForSync } from '@/lib/offline/note-sync'
import { cacheRecentImages } from '@/lib/offline/media-cache'

export const noteKeys = {
  all: ['notes'] as const,
  byDate: (groupId: string, date: string) => [...noteKeys.all, groupId, date] as const,
  recent: (groupId: string) => [...noteKeys.all, 'recent', groupId] as const,
  calendar: (groupId: string, month: string, authorId?: string) =>
    [...noteKeys.all, 'calendar', groupId, month, authorId ?? 'all'] as const,
}

export function useRecentNotes(groupId: string) {
  const qc = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)
  const query = useQuery({
    queryKey: noteKeys.recent(groupId),
    queryFn: async () => mergePendingNotes(await notesApi.recent(groupId), userId, groupId),
    enabled: !!groupId,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!query.data) return
    void cacheRecentImages(query.data)

    if (!navigator.onLine) return
    const dates = [...new Set(query.data.map((note) => note.diary_date))]
    for (const date of dates) {
      void qc.prefetchQuery({
        queryKey: noteKeys.byDate(groupId, date),
        queryFn: async () => mergePendingNotes(await notesApi.listByDate(groupId, date), userId, groupId, date),
        staleTime: 5 * 60 * 1000,
      })
    }
  }, [groupId, qc, query.data, userId])

  return query
}

export function useNotesByDate(groupId: string, date: string) {
  const userId = useAuthStore((state) => state.user?.id)
  const query = useQuery({
    queryKey: noteKeys.byDate(groupId, date),
    queryFn: async () => mergePendingNotes(await notesApi.listByDate(groupId, date), userId, groupId, date),
    enabled: !!groupId && !!date,
  })

  useEffect(() => {
    if (query.data) void cacheRecentImages(query.data)
  }, [query.data])

  return query
}

export interface CreateNoteMutationPayload extends CreateNotePayload {
  media_files?: File[]
}

export function useCreateNote(groupId: string, date: string) {
  const user = useAuthStore((state) => state.user)
  return useMutation({
    mutationFn: (payload: CreateNoteMutationPayload) => {
      if (!user) throw new Error('Sign in before saving a memory.')
      return queueNoteForSync({
        groupId,
        authorId: user.id,
        date: payload.date ?? date,
        content: payload.content,
        mediaFiles: payload.media_files,
      })
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
