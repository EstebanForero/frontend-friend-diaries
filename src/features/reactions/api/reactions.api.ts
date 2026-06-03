import { apiClient } from '@/lib/api/client'
import type { Reaction, ReactionType } from '@/types'

export const reactionsApi = {
  list: (noteId: string) =>
    apiClient.get<Reaction[]>(`/notes/${noteId}/reactions`),

  upsert: (noteId: string, reaction_type: ReactionType) =>
    apiClient.put<void>(`/notes/${noteId}/reactions`, { reaction_type }),

  remove: (noteId: string) =>
    apiClient.delete<void>(`/notes/${noteId}/reactions`),
}
