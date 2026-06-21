const IMAGE_CACHE = 'diary-images-v1'
const MAX_IMAGES = 400 // ~10-20 MB depending on image sizes

// ─── Image caching ───────────────────────────────────────────────────────────
// Cache images from MinIO using the object path as the key (ignoring presigned
// query params which rotate every 24 h). Serves from cache when offline.

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only intercept image requests that look like our MinIO storage URLs
  // (path contains /friend-diaries/images/ regardless of the hostname)
  if (!url.pathname.includes('/friend-diaries/images/')) return

  // Use origin + path as cache key so the same image isn't stored twice
  // when the presigned signature changes
  const stableKey = url.origin + url.pathname

  event.respondWith(
    (async () => {
      const cache = await caches.open(IMAGE_CACHE)

      // Serve from cache first (cache-first strategy — images never change)
      const cached = await cache.match(stableKey)
      if (cached) return cached

      // Not in cache — fetch from network
      let response
      try {
        response = await fetch(event.request)
      } catch {
        // Offline and not in cache — return a transparent 1×1 pixel as placeholder
        return new Response(
          atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
          { headers: { 'Content-Type': 'image/gif' } }
        )
      }

      if (response.ok || response.type === 'opaque') {
        cache.put(stableKey, response.clone())
        // Evict oldest entries if over the limit
        cache.keys().then((keys) => {
          if (keys.length > MAX_IMAGES) {
            const toDelete = keys.slice(0, keys.length - MAX_IMAGES)
            toDelete.forEach((k) => cache.delete(k))
          }
        })
      }

      return response
    })()
  )
})

// ─── Push notifications ───────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Our Diary', {
      body: data.body ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url ?? '/' },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
