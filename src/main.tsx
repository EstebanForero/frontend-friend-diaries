import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import { queryClient } from './lib/api/query-client'
import { useAuthStore } from './store/auth.store'
import { authApi } from './features/auth/api/auth.api'
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
    authApi
      .refresh()
      .then((data) => {
        auth.setAuth(data.user, data.access_token)
      })
      .catch(() => {
        if (useAuthStore.getState().isAuthenticated) {
          auth.setLoading(false)
          return
        }
        auth.clearAuth()
      })
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
