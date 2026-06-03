import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import { queryClient } from './lib/api/query-client'
import { useAuthStore } from './store/auth.store'
import { authApi } from './features/auth/api/auth.api'
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
      } catch {
        if (cancelled) return
        await sessionStore.clear()
        auth.clearAuth()
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
