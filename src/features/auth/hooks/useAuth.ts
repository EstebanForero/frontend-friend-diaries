import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { authApi } from '../api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { queryClient } from '@/lib/api/query-client'
import { sessionStore } from '@/lib/session/session-store'

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
      void sessionStore.save({
        user: data.user,
        refreshToken: data.refresh_token ?? null,
        savedAt: new Date().toISOString(),
      })
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
      void sessionStore.clear()
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
        const session = await sessionStore.load()
        const data = await authApi.refresh(session?.refreshToken)
        setAuth(data.user, data.access_token)
        await sessionStore.save({
          user: data.user,
          refreshToken: data.refresh_token ?? session?.refreshToken ?? null,
          savedAt: new Date().toISOString(),
        })
        return data
      } catch {
        await sessionStore.clear()
        clearAuth()
        return null
      }
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
