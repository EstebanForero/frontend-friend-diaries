import React from 'react'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/sonner'
import { useSystemTheme } from '@/hooks/useTheme'
import type { AuthState } from '@/store/auth.store'

interface RouterContext {
  queryClient: QueryClient
  auth: AuthState
}

// Lazy-load router devtools — never bundled in production.
const TanStackRouterDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import('@tanstack/router-devtools').then((mod) => ({
        default: mod.TanStackRouterDevtools,
      })),
    )
  : () => null

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  useSystemTheme()

  return (
    <>
      <Outlet />
      <Toaster position="top-right" richColors />
      {import.meta.env.DEV && (
        <React.Suspense>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </React.Suspense>
      )}
    </>
  )
}
