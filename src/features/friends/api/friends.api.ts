import { apiClient } from '@/lib/api/client'
import type { Friend, FriendRequest } from '@/types'

export const friendsApi = {
  list: () =>
    apiClient.get<Friend[]>('/friends'),

  listRequests: () =>
    apiClient.get<FriendRequest[]>('/friends/requests'),

  sendRequest: (appId: string) =>
    apiClient.post<{ friendship_id: string }>('/friends/request', { app_id: appId }),

  accept: (friendshipId: string) =>
    apiClient.post<void>(`/friends/requests/${friendshipId}/accept`),

  decline: (friendshipId: string) =>
    apiClient.post<void>(`/friends/requests/${friendshipId}/decline`),

  remove: (friendshipId: string) =>
    apiClient.delete<void>(`/friends/${friendshipId}`),

  setLabel: (friendshipId: string, tag: string, nickname: string) =>
    apiClient.put<void>(`/friends/${friendshipId}/label`, { tag, nickname }),
}
