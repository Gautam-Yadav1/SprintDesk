import { useEffect, type RefObject } from 'react'

/**
 * Calls `handler` when a pointer press lands outside every provided element.
 * Bound on `pointerdown` so a dropdown closes before the click resolves.
 */
export function useOnClickOutside(
  refs: RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      const inside = refs.some((ref) => ref.current?.contains(target))
      if (!inside) handler()
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
    // `refs` is a stable-length array of refs from the caller's render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, handler])
}
