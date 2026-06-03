import { apiClient } from '@/lib/api/client'
import type { Note } from '@/types'

export interface CreateNotePayload {
  content: string
  date?: string
}

export interface UpdateNotePayload {
  content: string
}

export const notesApi = {
  listByDate: (groupId: string, date: string) =>
    apiClient.get<Note[]>(`/groups/${groupId}/notes/${date}`),

  create: (groupId: string, payload: CreateNotePayload) =>
    apiClient.post<Note>(`/groups/${groupId}/notes`, payload),

  update: (noteId: string, payload: UpdateNotePayload) =>
    apiClient.patch<Note>(`/notes/${noteId}`, payload),

  delete: (noteId: string) =>
    apiClient.delete<void>(`/notes/${noteId}`),

  createShareToken: (noteId: string) =>
    apiClient.post<{ share_token: string }>(`/notes/${noteId}/share`),

  getByShareToken: (token: string) =>
    apiClient.get<Note>(`/share/notes/${token}`),

  calendarSummary: (groupId: string, month: string, authorId?: string) => {
    const params = new URLSearchParams({ month })
    if (authorId) params.set('author', authorId)
    return apiClient.get<Record<string, number>>(`/groups/${groupId}/notes/calendar?${params}`)
  },
}
