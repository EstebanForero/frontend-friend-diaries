import { create } from 'zustand'
import type { User } from '@/types'
import { apiClient } from '@/lib/api/client'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, accessToken: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) => {
    apiClient.setAccessToken(accessToken)
    set({ user, isAuthenticated: true, isLoading: false })
  },

  clearAuth: () => {
    apiClient.setAccessToken(null)
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  setLoading: (isLoading) => set({ isLoading }),
}))
