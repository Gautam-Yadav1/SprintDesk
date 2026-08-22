import { QueryClient } from '@tanstack/react-query'
import { HttpError } from './http'

/**
 * Shared client configuration. A 401 is already handled by the HTTP layer's
 * refresh-and-retry, so retrying it here would only duplicate work; 4xx in
 * general is not worth retrying.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof HttpError && error.status < 500) return false
          return failureCount < 2
        },
      },
      mutations: { retry: false },
    },
  })
}
