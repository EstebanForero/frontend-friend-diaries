import { ApiError, apiClient } from '@/lib/api/client'
import { queryClient } from '@/lib/api/query-client'
import { mediaApi } from '@/features/media/api/media.api'
import { notesApi } from '@/features/notes/api/notes.api'
import type { Note } from '@/types'
import {
  countQueuedNotes,
  deleteQueuedNote,
  listQueuedNotes,
  putQueuedNote,
  type QueuedMedia,
  type QueuedNote,
} from './offline-db'
import { cacheRecentImages } from './media-cache'

const noteKeys = {
  all: ['notes'] as const,
  byDate: (groupId: string, date: string) => ['notes', groupId, date] as const,
  recent: (groupId: string) => ['notes', 'recent', groupId] as const,
}

export interface OfflineSyncSnapshot {
  online: boolean
  syncing: boolean
  pendingCount: number
  lastError?: string
}

export interface QueueNoteInput {
  groupId: string
  authorId: string
  date: string
  content: string
  mediaFiles?: File[]
}

let activeUserId: string | null = null
let started = false
let syncing = false
let snapshot: OfflineSyncSnapshot = {
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  syncing: false,
  pendingCount: 0,
}
const listeners = new Set<() => void>()

function publish(next: Partial<OfflineSyncSnapshot>) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((listener) => listener())
}

export function getOfflineSyncSnapshot() {
  return snapshot
}

export function subscribeOfflineSync(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function refreshCount() {
  publish({
    pendingCount: activeUserId ? await countQueuedNotes(activeUserId) : 0,
  })
}

function queuedMedia(files: File[]): QueuedMedia[] {
  return files.map((file) => ({
    id: crypto.randomUUID(),
    blob: file,
    name: file.name,
    type: file.type,
    kind: file.type.startsWith('video/') ? 'video' : 'image',
  }))
}

function localNote(record: QueuedNote): Note {
  return {
    id: `local-${record.clientId}`,
    client_id: record.clientId,
    group_id: record.groupId,
    author_id: record.authorId,
    diary_date: record.date,
    content: record.content,
    is_edited: false,
    is_deleted: false,
    media: record.media.map((media) => ({
      id: `local-${media.id}`,
      media_url: URL.createObjectURL(media.blob),
      mime_type: media.type,
      media_kind: media.kind,
    })),
    created_at: record.createdAt,
    updated_at: record.createdAt,
    sync_status: record.lastError ? 'failed' : 'pending',
  }
}

function addLocalNote(record: QueuedNote) {
  const optimistic = localNote(record)
  queryClient.setQueryData<Note[]>(noteKeys.byDate(record.groupId, record.date), (current = []) => {
    if (current.some((note) => note.client_id === record.clientId)) {
      return current.map((note) => (note.client_id === record.clientId ? optimistic : note))
    }
    return [...current, optimistic]
  })
  queryClient.setQueryData<Note[]>(noteKeys.recent(record.groupId), (current = []) => {
    if (current.some((note) => note.client_id === record.clientId)) {
      return current.map((note) => (note.client_id === record.clientId ? optimistic : note))
    }
    return [optimistic, ...current].slice(0, 8)
  })
  return optimistic
}

function updateLocalNote(record: QueuedNote, serverNote?: Note) {
  const update = (notes: Note[] | undefined): Note[] =>
    (notes ?? []).map((note) => {
      if (note.client_id !== record.clientId) return note
      const syncStatus: Note['sync_status'] = record.lastError ? 'failed' : 'pending'
      return serverNote ?? { ...note, sync_status: syncStatus }
    })
  queryClient.setQueriesData<Note[]>({ queryKey: noteKeys.all }, update)
}

export async function queueNoteForSync(input: QueueNoteInput): Promise<Note> {
  const record: QueuedNote = {
    clientId: crypto.randomUUID(),
    groupId: input.groupId,
    authorId: input.authorId,
    date: input.date,
    content: input.content,
    media: queuedMedia(input.mediaFiles ?? []),
    createdAt: new Date().toISOString(),
    attempts: 0,
  }
  await putQueuedNote(record)
  const optimistic = addLocalNote(record)
  await refreshCount()
  void syncPendingNotes()
  return optimistic
}

export async function restorePendingNotes(userId: string) {
  for (const record of await listQueuedNotes(userId)) addLocalNote(record)
  await refreshCount()
}

export async function mergePendingNotes(
  serverNotes: Note[],
  userId: string | undefined,
  groupId: string,
  date?: string,
) {
  if (!userId) return serverNotes
  const serverClientIds = new Set(serverNotes.flatMap((note) => (note.client_id ? [note.client_id] : [])))
  const pending = (await listQueuedNotes(userId))
    .filter((record) => record.groupId === groupId && (!date || record.date === date))
    .filter((record) => !serverClientIds.has(record.clientId))
    .map(localNote)

  const combined = [...serverNotes, ...pending]
  return combined.sort((a, b) =>
    date ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at),
  )
}

export function configureOfflineSync(userId: string | null) {
  activeUserId = userId
  publish({ online: navigator.onLine, lastError: undefined })

  if (!started) {
    started = true
    window.addEventListener('online', () => {
      publish({ online: true, lastError: undefined })
      void syncPendingNotes()
    })
    window.addEventListener('offline', () => publish({ online: false, syncing: false }))
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void syncPendingNotes()
    })
    window.setInterval(() => void syncPendingNotes(), 30_000)
  }

  if (userId) {
    void restorePendingNotes(userId)
    void syncPendingNotes()
  } else {
    publish({ pendingCount: 0, syncing: false })
  }
}

export async function syncPendingNotes() {
  if (syncing || !activeUserId || !navigator.onLine || !apiClient.getAccessToken()) return
  syncing = true
  publish({ syncing: true, online: true, lastError: undefined })

  try {
    const records = await listQueuedNotes(activeUserId)
    for (const record of records) {
      try {
        if (record.lastError) {
          record.lastError = undefined
          await putQueuedNote(record)
          updateLocalNote(record)
        }
        for (const media of record.media) {
          if (media.uploadedId) continue
          const file = new File([media.blob], media.name, { type: media.type })
          const uploaded = await mediaApi.upload(file)
          media.uploadedId = uploaded.id
          await putQueuedNote(record)
        }

        const synced = await notesApi.create(record.groupId, {
          content: record.content,
          date: record.date,
          client_id: record.clientId,
          media_ids: record.media.map((media) => media.uploadedId!).filter(Boolean),
        })
        await deleteQueuedNote(record.clientId)
        updateLocalNote(record, synced)
        void cacheRecentImages([synced])
        await refreshCount()
      } catch (error) {
        record.attempts += 1
        record.lastError = error instanceof Error ? error.message : 'Could not sync this memory.'
        await putQueuedNote(record)
        updateLocalNote(record)
        publish({ lastError: record.lastError })

        // A network/authentication failure affects every remaining item. Keep
        // the full outbox intact and continue after connectivity/session recovery.
        if (!(error instanceof ApiError) || error.status === 0 || error.status === 401 || error.status === 403) break
      }
    }

    if (navigator.onLine) {
      void queryClient.invalidateQueries({ queryKey: noteKeys.all })
    }
  } finally {
    syncing = false
    publish({ syncing: false, online: navigator.onLine })
    await refreshCount()
  }
}
