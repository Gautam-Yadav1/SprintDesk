import type { ReactNode } from 'react'

export interface ChartCardProps {
  title: string
  description: string
  /** Renders the empty state instead of the chart when there is no data. */
  isEmpty?: boolean
  emptyMessage?: string
  /** Optional control row, e.g. the trend date range. */
  action?: ReactNode
  children: ReactNode
}

/**
 * Shared frame for every chart: heading, description, optional controls and a
 * real empty state. `data-chart-export` marks the region the PNG export reads.
 */
export function ChartCard({
  title,
  description,
  isEmpty,
  emptyMessage = 'No data for this view yet.',
  action,
  children,
}: ChartCardProps) {
  return (
    <figure
      data-chart-export={title}
      className="fn-card relative flex min-w-0 flex-col rounded-md p-4"
    >
      <figcaption className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block font-display text-2xl font-bold leading-tight text-content">
            {title}
          </span>
          <span className="block text-xs text-content-muted">{description}</span>
        </span>
        {action}
      </figcaption>

      {isEmpty ? (
        <p className="grid flex-1 place-items-center rounded-md border border-dashed border-line px-4 py-10 text-center text-sm text-content-muted">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </figure>
  )
}
