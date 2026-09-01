import { openDB } from 'idb'

const DB_NAME = 'friend-diaries-offline'
const OUTBOX_STORE = 'note-outbox'
const MEDIA_STORE = 'media-cache'
const MAX_CACHED_IMAGES = 80

export interface QueuedMedia {
  id: string
  blob: Blob
  name: string
  type: string
  kind: 'image' | 'video'
  uploadedId?: string
}

export interface QueuedNote {
  clientId: string
  groupId: string
  authorId: string
  date: string
  content: string
  media: QueuedMedia[]
  createdAt: string
  attempts: number
  lastError?: string
}

interface CachedMedia {
  key: string
  blob: Blob
  cachedAt: number
}

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    const outbox = db.createObjectStore(OUTBOX_STORE, { keyPath: 'clientId' })
    outbox.createIndex('authorId', 'authorId')
    outbox.createIndex('createdAt', 'createdAt')
    const media = db.createObjectStore(MEDIA_STORE, { keyPath: 'key' })
    media.createIndex('cachedAt', 'cachedAt')
  },
})

export async function putQueuedNote(note: QueuedNote) {
  const db = await dbPromise
  await db.put(OUTBOX_STORE, note)
}

export async function listQueuedNotes(authorId?: string): Promise<QueuedNote[]> {
  const db = await dbPromise
  const notes = authorId
    ? ((await db.getAllFromIndex(OUTBOX_STORE, 'authorId', authorId)) as QueuedNote[])
    : ((await db.getAll(OUTBOX_STORE)) as QueuedNote[])
  return notes.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function deleteQueuedNote(clientId: string) {
  const db = await dbPromise
  await db.delete(OUTBOX_STORE, clientId)
}

export async function countQueuedNotes(authorId?: string) {
  const db = await dbPromise
  return authorId ? db.countFromIndex(OUTBOX_STORE, 'authorId', authorId) : db.count(OUTBOX_STORE)
}

export function stableMediaKey(url: string) {
  try {
    const parsed = new URL(url, window.location.origin)
    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return url.split('?')[0]
  }
}

export async function getCachedMedia(url: string): Promise<Blob | undefined> {
  const db = await dbPromise
  const record = (await db.get(MEDIA_STORE, stableMediaKey(url))) as CachedMedia | undefined
  return record?.blob
}

export async function putCachedMedia(url: string, blob: Blob) {
  if (!blob.type.startsWith('image/')) return
  const db = await dbPromise
  const record: CachedMedia = {
    key: stableMediaKey(url),
    blob,
    cachedAt: Date.now(),
  }
  await db.put(MEDIA_STORE, record)

  const keys = await db.getAllKeysFromIndex(MEDIA_STORE, 'cachedAt')
  if (keys.length > MAX_CACHED_IMAGES) {
    const tx = db.transaction(MEDIA_STORE, 'readwrite')
    for (const key of keys.slice(0, keys.length - MAX_CACHED_IMAGES)) {
      await tx.store.delete(key)
    }
    await tx.done
  }
}
