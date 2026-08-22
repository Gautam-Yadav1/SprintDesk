import { cn } from '@/lib/cn'

export interface AvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md'
  /**
   * Set when the person's name is already visible next to the image, so screen
   * readers do not hear it twice.
   */
  decorative?: boolean
  className?: string
}

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
} as const

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
}

export function Avatar({ name, src, size = 'sm', decorative, className }: AvatarProps) {
  const shared = cn(
    'shrink-0 rounded-full object-cover ring-1 ring-line',
    SIZES[size],
    className,
  )

  if (!src) {
    return (
      <span
        className={cn(shared, 'grid place-items-center bg-kraft/30 font-mono font-semibold text-content')}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : name}
        aria-hidden={decorative || undefined}
      >
        {initials(name)}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={decorative ? '' : `Profile photo of ${name}`}
      loading="lazy"
      decoding="async"
      width={40}
      height={40}
      className={shared}
    />
  )
}
