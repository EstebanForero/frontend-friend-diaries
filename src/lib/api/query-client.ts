import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 min — consider data fresh for 5 min
      gcTime: 24 * 60 * 60 * 1000, // 24 h — keep in memory a long time; persister handles disk
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) return false
        return failureCount < 2
      },
      // On reconnect, refetch stale queries so offline→online transitions update content
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: false,
    },
  },
})
