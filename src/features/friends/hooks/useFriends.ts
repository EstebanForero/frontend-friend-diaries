import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { friendsApi } from '../api/friends.api'

export const friendKeys = {
  all: ['friends'] as const,
  list: () => [...friendKeys.all, 'list'] as const,
  requests: () => [...friendKeys.all, 'requests'] as const,
}

export function useFriends() {
  return useQuery({
    queryKey: friendKeys.list(),
    queryFn: friendsApi.list,
  })
}

export function useFriendRequests() {
  return useQuery({
    queryKey: friendKeys.requests(),
    queryFn: friendsApi.listRequests,
  })
}

export function useSendFriendRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (appId: string) => friendsApi.sendRequest(appId),
    onSuccess: () => qc.invalidateQueries({ queryKey: friendKeys.all }),
  })
}

export function useAcceptFriendRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => friendsApi.accept(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: friendKeys.all }),
  })
}

export function useDeclineFriendRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => friendsApi.decline(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: friendKeys.requests() }),
  })
}

export function useSetFriendLabel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tag, nickname }: { id: string; tag: string; nickname: string }) =>
      friendsApi.setLabel(id, tag, nickname),
    onSuccess: () => qc.invalidateQueries({ queryKey: friendKeys.list() }),
  })
}

export function useRemoveFriend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => friendsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: friendKeys.list() }),
  })
}
