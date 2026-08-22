import { Spinner } from '@/components/ui/Spinner'

/** Shown while the initial session is validated, before any route renders. */
export function FullScreenLoader({ label = 'Restoring your session' }: { label?: string }) {
  return (
    <div
      role="status"
      className="grid min-h-dvh place-items-center bg-surface px-4 text-center"
    >
      <div className="space-y-3">
        <Spinner className="mx-auto h-8 w-8 text-brand-600 dark:text-brand-300" />
        <p className="text-sm text-content-muted">{label}</p>
      </div>
    </div>
  )
}
