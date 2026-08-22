import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

/**
 * Tones are laid over the surface as translucent ink rather than as their own
 * opaque swatch, so every pill picks up the warmth of the paper beneath it
 * instead of floating on a cool grey chip.
 */
const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-content/[0.07] text-content-muted ring-content/15',
  brand: 'bg-brand-600/12 text-brand-700 ring-brand-600/25 dark:text-brand-300 dark:ring-brand-400/30',
  success:
    'bg-emerald-600/12 text-emerald-800 ring-emerald-600/25 dark:text-emerald-300 dark:ring-emerald-400/30',
  warning:
    'bg-amber-600/14 text-amber-800 ring-amber-700/25 dark:text-amber-300 dark:ring-amber-400/30',
  danger:
    'bg-red-600/12 text-red-800 ring-red-600/25 dark:text-red-300 dark:ring-red-400/30',
}

export interface BadgeProps {
  tone?: BadgeTone
  children: React.ReactNode
  className?: string
}

/** Compact status/priority pill shared by cards, the drawer and the table. */
export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        // Squared off and set in the typewriter face: a stamp, not a pill.
        'sd-label inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
