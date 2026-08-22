import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import { useCurrentMemberId } from '@/features/board/hooks/useCurrentMember'
import { useNotificationPolling } from '../hooks/useNotificationPolling'
import { selectUnreadCount, useNotificationsStore } from '../store/notificationsStore'
import { NotificationPanel } from './NotificationPanel'

/**
 * Mounted once by the app shell, so it is also the single place the polling
 * loop runs — and the only component that knows whether the panel is open,
 * which is what decides between a toast and a silent list update.
 */
export function NotificationBell() {
  const id = useId()
  const [isOpen, setIsOpen] = useState(false)
  const memberId = useCurrentMemberId()
  const unread = useNotificationsStore(selectUnreadCount(memberId))
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useNotificationPolling({ announce: !isOpen })

  const close = useCallback(() => setIsOpen(false), [])
  useOnClickOutside([triggerRef, panelRef], close, isOpen)

  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        id={id}
        variant="ghost"
        size="icon"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : 'Notifications, none unread'
        }
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="relative inline-flex">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M18 8a6 6 0 1 0-12 0c0 4.5-1.5 6-1.5 6h15S18 12.5 18 8Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M10.3 18a2 2 0 0 0 3.4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          {unread > 0 && (
            <span
              className="absolute -right-1.5 -top-1 min-w-[1.05rem] rounded-full bg-brand-600 px-1 text-[10px] font-semibold leading-[1.05rem] text-white"
              aria-hidden="true"
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </span>
      </Button>

      {isOpen && memberId !== undefined && (
        <div
          ref={panelRef}
          className="fixed inset-x-2 top-14 z-50 animate-slide-up sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96"
        >
          <NotificationPanel labelledBy={id} memberId={memberId} />
        </div>
      )}
    </div>
  )
}
