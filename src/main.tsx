import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { routeTree } from './routeTree.gen'
import { queryClient } from './lib/api/query-client'
import { idbPersister } from './lib/api/idb-persister'
import { useAuthStore } from './store/auth.store'
import { authApi } from './features/auth/api/auth.api'
import { ApiError } from './lib/api/client'
import { sessionStore } from './lib/session/session-store'
import { configureOfflineSync } from './lib/offline/note-sync'
import './index.css'

// Register the service worker for all users (image caching + push notifications)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
    // SW registration failure is non-fatal
  })

  // When the user clicks a push notification, the SW sends this message before
  // navigating so the app can clear stale cached notes.
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'PUSH_NOTIFICATION_CLICK') {
      void queryClient.invalidateQueries({ queryKey: ['notes'] })
    }
  })
}

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const auth = useAuthStore()

  React.useEffect(() => {
    let cancelled = false

    async function restoreAuth() {
      const session = await sessionStore.load()
      if (cancelled) return

      if (session?.user) {
        auth.restoreSession(session.user)
        configureOfflineSync(session.user.id)
      }

      try {
        const data = await authApi.refresh(session?.refreshToken)
        if (cancelled) return
        auth.setAuth(data.user, data.access_token)
        await sessionStore.save({
          user: data.user,
          refreshToken: data.refresh_token ?? session?.refreshToken ?? null,
          savedAt: new Date().toISOString(),
        })
        // Re-run any queries that fired before the token was available
        void queryClient.invalidateQueries()
      } catch (err) {
        if (cancelled) return
        // Only wipe the session for definitive auth failures (401/403).
        // Network errors or server hiccups should NOT log the user out.
        const isAuthFailure = err instanceof ApiError && (err.status === 401 || err.status === 403)
        if (isAuthFailure) {
          await sessionStore.clear()
          auth.clearAuth()
        } else if (session?.user) {
          // Couldn't reach the server but we have a stored session — keep the user
          // logged in with the cached user data and stop the loading spinner.
          // API calls will fail individually until connectivity is restored.
          auth.setLoading(false)
        } else {
          auth.clearAuth()
        }
      }
    }

    void restoreAuth()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: idbPersister,
        maxAge: 90 * 24 * 60 * 60 * 1000, // previously opened memories remain readable offline
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const key = query.queryKey as unknown[]
            // Don't persist notification queries — they must always be fresh
            if (key[0] === 'notifications') return false
            // Only persist successful queries
            return query.state.status === 'success'
          },
        },
      }}
    >
      <RouterProvider router={router} context={{ queryClient, auth }} />
    </PersistQueryClientProvider>
  )
}

const rootElement = document.getElementById('root')!
ReactDOM.createRoot(rootElement).render(<App />)
