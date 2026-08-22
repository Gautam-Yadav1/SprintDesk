import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { restoreSession } from '../services/authSession'
import { useAuthStore } from '../store/authStore'

/**
 * Runs the one silent-refresh attempt that decides whether the app boots into
 * an authenticated session. Held in Query so React strict-mode double mounts
 * (and any remount of the shell) share a single in-flight request.
 */
export function useSessionBootstrap(): { isBootstrapping: boolean } {
  const status = useAuthStore((state) => state.status)

  useQuery({
    queryKey: queryKeys.session,
    queryFn: restoreSession,
    enabled: status === 'bootstrapping',
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return { isBootstrapping: status === 'bootstrapping' }
}
