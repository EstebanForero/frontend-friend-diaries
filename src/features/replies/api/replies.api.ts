import { apiClient } from '@/lib/api/client'
import type { Reply } from '@/types'

export const repliesApi = {
  list: (noteId: string) =>
    apiClient.get<Reply[]>(`/notes/${noteId}/replies`),

  create: (noteId: string, content: string) =>
    apiClient.post<Reply>(`/notes/${noteId}/replies`, { content }),

  update: (replyId: string, content: string) =>
    apiClient.patch<Reply>(`/replies/${replyId}`, { content }),

  delete: (replyId: string) =>
    apiClient.delete<void>(`/replies/${replyId}`),
}
