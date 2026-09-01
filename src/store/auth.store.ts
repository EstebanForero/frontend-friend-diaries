import { create } from 'zustand'
import type { User } from '@/types'
import { apiClient } from '@/lib/api/client'
import { configureOfflineSync } from '@/lib/offline/note-sync'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  restoreSession: (user: User) => void
  setAuth: (user: User, accessToken: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  restoreSession: (user) => {
    set({ user, isAuthenticated: true, isLoading: true })
  },

  setAuth: (user, accessToken) => {
    apiClient.setAccessToken(accessToken)
    configureOfflineSync(user.id)
    set({ user, isAuthenticated: true, isLoading: false })
  },

  clearAuth: () => {
    apiClient.setAccessToken(null)
    configureOfflineSync(null)
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  setLoading: (isLoading) => set({ isLoading }),
}))
