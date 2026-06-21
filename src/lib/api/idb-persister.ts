import { openDB } from 'idb'
import type { Persister, PersistedClient } from '@tanstack/react-query-persist-client'

const DB_NAME = 'friend-diaries-cache'
const STORE = 'query-cache'
const KEY = 'v1'

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE)
  },
})

export const idbPersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    const db = await dbPromise
    await db.put(STORE, client, KEY)
  },
  restoreClient: async (): Promise<PersistedClient | undefined> => {
    const db = await dbPromise
    return db.get(STORE, KEY)
  },
  removeClient: async () => {
    const db = await dbPromise
    await db.delete(STORE, KEY)
  },
}
