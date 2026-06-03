import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { authApi } from '../api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { queryClient } from '@/lib/api/query-client'

export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (user) => {
      // After register, user still needs to login
      void user
    },
  })
}

export function useLogin() {
  const { setAuth } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.access_token)
      void router.navigate({ to: '/app/groups' })
    },
  })
}

export function useLogout() {
  const { clearAuth } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth()
      queryClient.clear()
      void router.navigate({ to: '/login' })
    },
  })
}

export function useRefreshAuth() {
  const { setAuth, clearAuth } = useAuthStore()

  return useQuery({
    queryKey: ['auth', 'refresh'],
    queryFn: async () => {
      try {
        const data = await authApi.refresh()
        setAuth(data.user, data.access_token)
        return data
      } catch {
        clearAuth()
        return null
      }
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
