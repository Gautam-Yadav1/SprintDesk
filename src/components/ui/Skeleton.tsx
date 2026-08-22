import { cn } from '@/lib/cn'

export interface SkeletonProps {
  className?: string
}

/** Single shimmering placeholder block. Hidden from assistive tech. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-surface-sunken', className)}
    />
  )
}

/**
 * Route-level fallback for `React.lazy` boundaries — the same silhouette every
 * page shows while its chunk and first query resolve.
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6" role="status" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}
