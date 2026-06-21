import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AppLayout } from '@/components/shared/layout/AppLayout'
import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/app')({
  beforeLoad: ({ context }) => {
    // Only hard-redirect when we know for certain the user is not logged in.
    // While isLoading=true the session restore is still in-flight — let it finish.
    if (!context.auth.isAuthenticated && !context.auth.isLoading) {
      throw redirect({ to: '/login' })
    }
  },
  component: AppRouteComponent,
})

function AppRouteComponent() {
  const { isLoading, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  // Redirect once session restore settles and the user is not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: '/login', replace: true })
    }
  }, [isLoading, isAuthenticated, navigate])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
