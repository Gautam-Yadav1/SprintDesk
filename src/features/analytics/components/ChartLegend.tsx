import { cn } from '@/lib/cn'

export interface ChartLegendItem {
  label: string
  color: string
  /** Shown for legends that double as a value readout (the status donut). */
  value?: number
  share?: string
}

export interface ChartLegendProps {
  items: ChartLegendItem[]
  layout?: 'row' | 'column'
  className?: string
}

/**
 * Legend shared by the charts. The `data-legend-*` attributes let the PNG
 * export redraw it on the canvas, since HTML legends are not part of the SVG.
 */
export function ChartLegend({ items, layout = 'row', className }: ChartLegendProps) {
  return (
    <ul
      data-chart-legend
      className={cn(
        // Typed legend: label left, count and share right-aligned.
        'sd-label',
        layout === 'row' ? 'flex flex-wrap gap-x-4 gap-y-1' : 'w-full space-y-2',
        className,
      )}
    >
      {items.map((item) => (
        <li
          key={item.label}
          data-legend-item={item.label}
          data-legend-color={item.color}
          data-legend-value={item.value}
          data-legend-share={item.share}
          className="flex items-center gap-2"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[1px]"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          <span className="text-content-muted">{item.label}</span>
          {item.value !== undefined && (
            <span className="ml-auto font-medium tabular-nums text-content">{item.value}</span>
          )}
          {item.share && (
            <span className="w-12 text-right sd-label tabular-nums text-content-muted">
              {item.share}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
