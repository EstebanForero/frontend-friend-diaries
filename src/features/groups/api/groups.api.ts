import { apiClient } from '@/lib/api/client'
import type { Group, GroupMember } from '@/types'

export interface CreateGroupPayload {
  name: string
  timezone?: string
}

export interface InvitePayload {
  invitee_id: string
}

export const groupsApi = {
  list: () =>
    apiClient.get<Group[]>('/groups'),

  get: (groupId: string) =>
    apiClient.get<Group>(`/groups/${groupId}`),

  create: (payload: CreateGroupPayload) =>
    apiClient.post<Group>('/groups', payload),

  invite: (groupId: string, payload: InvitePayload) =>
    apiClient.post<void>(`/groups/${groupId}/invite`, payload),

  acceptInvitation: (groupId: string) =>
    apiClient.post<void>(`/groups/${groupId}/accept`),

  declineInvitation: (groupId: string) =>
    apiClient.post<void>(`/groups/${groupId}/decline`),

  leave: (groupId: string) =>
    apiClient.delete<void>(`/groups/${groupId}/leave`),
}
