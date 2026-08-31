import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { groupsApi, type CreateGroupPayload, type InvitePayload } from '../api/groups.api'

export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  detail: (id: string) => [...groupKeys.all, id] as const,
  members: (id: string) => [...groupKeys.all, id, 'members'] as const,
}

export function useGroups() {
  return useQuery({
    queryKey: groupKeys.lists(),
    queryFn: groupsApi.list,
  })
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: () => groupsApi.get(groupId),
    enabled: !!groupId,
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => groupsApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: groupKeys.lists() })
    },
  })
}

export function useUpdateGroup(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => groupsApi.update(groupId, payload),
    onSuccess: (group) => {
      qc.setQueryData(groupKeys.detail(groupId), group)
      void qc.invalidateQueries({ queryKey: groupKeys.lists() })
    },
  })
}

export function useInviteMember(groupId: string) {
  return useMutation({
    mutationFn: (payload: InvitePayload) => groupsApi.invite(groupId, payload),
  })
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: () => groupsApi.getMembers(groupId),
    enabled: !!groupId,
  })
}

export function useAcceptInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.acceptInvitation(groupId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: groupKeys.lists() })
    },
  })
}

export function useGroupInvitations() {
  return useQuery({
    queryKey: [...groupKeys.all, 'invitations'] as const,
    queryFn: groupsApi.getInvitations,
  })
}
