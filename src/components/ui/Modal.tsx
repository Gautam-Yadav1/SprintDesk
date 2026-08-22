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
    // Edge to edge from the bottom on a phone, a centred card from `sm` up.
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
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
          'relative flex w-full animate-slide-up flex-col border border-line bg-[var(--card)] shadow-2xl',
          // A sheet rises from the bottom edge on a phone, so only its top
          // corners round; it becomes a fully rounded card at `sm`.
          'max-h-[92dvh] rounded-t-xl sm:max-h-[85dvh] sm:rounded-md',
          size === 'sm' ? 'sm:max-w-md' : 'sm:max-w-2xl',
        )}
      >
        <div className="shrink-0 space-y-1 border-b border-line px-5 py-4">
          <h2 id={`${id}-title`} className="text-base font-semibold text-content">
            {title}
          </h2>
          {description && (
            <p id={`${id}-description`} className="text-sm text-content-muted">
              {description}
            </p>
          )}
        </div>
        {/* Only the body scrolls, so the title and actions stay reachable on a
            short viewport — an on-screen keyboard leaves very little room. */}
        {children && (
          <div className="sd-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        )}
        {footer && (
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
