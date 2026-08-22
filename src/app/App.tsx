import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ToastViewport } from '@/components/ui/Toast'
import { createQueryClient } from '@/lib/queryClient'
import { useSessionBootstrap } from '@/features/auth/hooks/useSessionBootstrap'
import { FullScreenLoader } from './FullScreenLoader'
import { AppRoutes } from './router'

const queryClient = createQueryClient()

function AppShell() {
  const { isBootstrapping } = useSessionBootstrap()

  // Nothing routes until the silent refresh settles, so an authenticated
  // reload never flashes the login screen (or the reverse).
  if (isBootstrapping) return <FullScreenLoader />

  return <AppRoutes />
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell />
        <ToastViewport />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
