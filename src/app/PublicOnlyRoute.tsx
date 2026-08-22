import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'

/** Keeps an authenticated user off `/login`, returning them where they came from. */
export function PublicOnlyRoute() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation() as { state?: { from?: string } }

  if (status === 'authenticated') {
    return <Navigate to={location.state?.from ?? '/dashboard'} replace />
  }

  return <Outlet />
}
