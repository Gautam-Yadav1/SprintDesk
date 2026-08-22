import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { useToastStore, type ToastVariant } from '@/hooks/useToast'

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  info: 'border-l-brand-500',
}

const VARIANT_ICON: Record<ToastVariant, string> = {
  success: 'M5 10.5 8.5 14 15 7',
  error: 'M10 6v5m0 3h.01',
  info: 'M10 9v5m0-8h.01',
}

/**
 * Single live region for the whole app, mounted once by the root layout.
 * Errors are announced assertively; everything else politely.
 */
export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)
  return createPortal(
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.variant === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto w-full max-w-sm animate-slide-up rounded-lg border border-l-4 border-line bg-surface-raised p-3 shadow-lg',
            VARIANT_STYLES[toast.variant],
          )}
        >
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-content-muted" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d={VARIANT_ICON[toast.variant]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-content">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-content-muted">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded p-0.5 text-content-muted transition-colors hover:text-content"
            >
              <span className="sr-only">Dismiss notification</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m6 6 8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  )
}
