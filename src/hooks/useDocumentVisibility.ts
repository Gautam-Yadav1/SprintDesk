import { useEffect, useState } from 'react'

/** True while the tab is in the foreground; polling pauses when it is not. */
export function useDocumentVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  )

  useEffect(() => {
    const onChange = () => setIsVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return isVisible
}
