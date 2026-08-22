import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { useFocusTrap } from '@/hooks/useFocusTrap'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  /** Action row pinned to the bottom of the dialog. */
  footer?: ReactNode
  size?: 'sm' | 'md'
}

/**
 * Portal-rendered dialog: focus-trapped, closes on Escape or a backdrop press,
 * and locks background scroll while open.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'sm',
}: ModalProps) {
  const id = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full animate-slide-up rounded-md border border-line bg-[var(--card)] shadow-2xl',
          size === 'sm' ? 'max-w-md' : 'max-w-2xl',
        )}
      >
        <div className="space-y-1 border-b border-line px-5 py-4">
          <h2 id={`${id}-title`} className="text-base font-semibold text-content">
            {title}
          </h2>
          {description && (
            <p id={`${id}-description`} className="text-sm text-content-muted">
              {description}
            </p>
          )}
        </div>
        {children && <div className="px-5 py-4">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
