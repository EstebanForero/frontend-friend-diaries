import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import { queryClient } from './lib/api/query-client'
import { useAuthStore } from './store/auth.store'
import { authApi } from './features/auth/api/auth.api'
import { ApiError } from './lib/api/client'
import { sessionStore } from './lib/session/session-store'
import './index.css'

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
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ queryClient, auth }} />
    </QueryClientProvider>
  )
}

const rootElement = document.getElementById('root')!
ReactDOM.createRoot(rootElement).render(
  <App />,
)
