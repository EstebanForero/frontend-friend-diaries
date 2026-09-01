import type { Note } from '@/types'
import { resolveMediaUrl } from '@/lib/utils'
import { getCachedMedia, putCachedMedia, stableMediaKey } from './offline-db'

const inFlight = new Set<string>()

export async function cacheImage(url: string) {
  const resolved = resolveMediaUrl(url)
  if (resolved.startsWith('blob:') || resolved.startsWith('data:')) return
  const key = stableMediaKey(resolved)
  if (inFlight.has(key) || (await getCachedMedia(resolved))) return

  inFlight.add(key)
  try {
    const response = await fetch(resolved)
    if (!response.ok) return
    const blob = await response.blob()
    await putCachedMedia(resolved, blob)
  } catch {
    // Losing connectivity while warming the cache is harmless.
  } finally {
    inFlight.delete(key)
  }
}

export async function cacheRecentImages(notes: Note[]) {
  if (!navigator.onLine) return
  const urls = notes
    .flatMap((note) => note.media)
    .filter((media) => media.media_kind === 'image')
    .map((media) => media.media_url)
    .slice(0, 24)

  // Keep this intentionally sequential to avoid saturating a phone connection.
  for (const url of urls) await cacheImage(url)
}

export async function cachedImageObjectUrl(url: string) {
  const blob = await getCachedMedia(resolveMediaUrl(url))
  return blob ? URL.createObjectURL(blob) : null
}
