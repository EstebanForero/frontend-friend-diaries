import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppLayout } from '@/components/shared/layout/AppLayout'

export const Route = createFileRoute('/app')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated && !context.auth.isLoading) {
      throw redirect({ to: '/login' })
    }
  },
  component: AppRouteComponent,
})

function AppRouteComponent() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
