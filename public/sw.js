const IMAGE_CACHE = 'diary-images-v1'
const APP_CACHE = 'diary-app-v1'
const MAX_IMAGES = 400 // ~10-20 MB depending on image sizes

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(['/', '/index.html'])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// ─── Image caching ───────────────────────────────────────────────────────────
// Cache images from MinIO using the object path as the key (ignoring presigned
// query params which rotate every 24 h). Serves from cache when offline.

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (
    event.request.method === 'GET' &&
    url.origin === self.location.origin &&
    !url.pathname.startsWith('/api/') &&
    ['document', 'script', 'style', 'font'].includes(event.request.destination)
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) caches.open(APP_CACHE).then((cache) => cache.put(event.request, response.clone()))
          return response
        })
        .catch(async () => {
          const cached = await caches.match(event.request)
          return cached ?? (await caches.match('/index.html'))
        }),
    )
    return
  }

  // Cache image responses from storage. The application also mirrors recent
  // images into IndexedDB for Android WebViews where service workers may not run.
  if (event.request.destination !== 'image' && !url.pathname.includes('/friend-diaries/images/')) return

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
        return new Response(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), {
          headers: { 'Content-Type': 'image/gif' },
        })
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
    })(),
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
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Tell the app to invalidate notes before navigating so fresh data loads
          client.postMessage({ type: 'PUSH_NOTIFICATION_CLICK', url })
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    }),
  )
})
