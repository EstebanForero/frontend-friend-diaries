import type { User } from '@/types'
import { isTauriRuntime } from '@/lib/runtime'

const STORAGE_KEY = 'friend-diaries.session'

export interface PersistedSession {
  user: User
  refreshToken?: string | null
  savedAt: string
}

interface SessionStore {
  load: () => Promise<PersistedSession | null>
  save: (session: PersistedSession) => Promise<void>
  clear: () => Promise<void>
}

const webSessionStore: SessionStore = {
  async load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as PersistedSession) : null
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
  },
  async save(session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  },
  async clear() {
    localStorage.removeItem(STORAGE_KEY)
  },
}

const tauriSessionStore: SessionStore = {
  async load() {
    const { invoke } = await import('@tauri-apps/api/core')
    const raw = await invoke<string | null>('session_load')
    return raw ? (JSON.parse(raw) as PersistedSession) : null
  },
  async save(session) {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('session_save', { session: JSON.stringify(session) })
  },
  async clear() {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('session_clear')
  },
}

export const sessionStore: SessionStore = {
  async load() {
    return getSessionStore().load()
  },
  async save(session) {
    return getSessionStore().save(session)
  },
  async clear() {
    return getSessionStore().clear()
  },
}

function getSessionStore() {
  return isTauriRuntime() ? tauriSessionStore : webSessionStore
}
