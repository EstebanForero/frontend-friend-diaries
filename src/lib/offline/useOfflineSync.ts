import { useSyncExternalStore } from 'react'
import { getOfflineSyncSnapshot, subscribeOfflineSync } from './note-sync'

export function useOfflineSync() {
  return useSyncExternalStore(subscribeOfflineSync, getOfflineSyncSnapshot, getOfflineSyncSnapshot)
}
