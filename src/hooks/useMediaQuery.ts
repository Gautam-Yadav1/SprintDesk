import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribes to a media query. `useSyncExternalStore` is the right primitive
 * here: the browser owns the value, so there is no effect and no extra render
 * pass to keep React in sync with it.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Charts and transitions must honour the OS "reduce motion" setting. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
