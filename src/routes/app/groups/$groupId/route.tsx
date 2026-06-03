import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/app/groups/$groupId')({
  component: () => <Outlet />,
})
