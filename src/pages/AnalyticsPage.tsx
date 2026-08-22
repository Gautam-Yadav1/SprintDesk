import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/hooks/useToast'
import { useChartTheme } from '@/features/analytics/chartTheme'
import { exportAnalyticsPng } from '@/features/analytics/exportPng'
import { useBoardAnalytics } from '@/features/analytics/hooks/useBoardAnalytics'
import { CompletionTrendChart } from '@/features/analytics/components/CompletionTrendChart'
import { PriorityChart } from '@/features/analytics/components/PriorityChart'
import { StatusChart } from '@/features/analytics/components/StatusChart'
import { VelocityChart } from '@/features/analytics/components/VelocityChart'
import { useSprints, useTasks } from '@/features/board/hooks/useBoardQueries'
import { useBoardStore } from '@/features/board/store/boardStore'

interface DateRange {
  from: string
  to: string
}

const NO_RANGE: DateRange = { from: '', to: '' }

function ChartsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" role="status" aria-label="Loading analytics">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-line bg-surface-raised p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-[240px] w-full" />
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const tasksQuery = useTasks()
  const sprintsQuery = useSprints()
  const columns = useBoardStore((state) => state.columns)
  const analytics = useBoardAnalytics(tasksQuery.data, sprintsQuery.data, columns)

  const chartTheme = useChartTheme()
  const { toast } = useToast()
  const chartsRef = useRef<HTMLDivElement>(null)
  const [range, setRange] = useState<DateRange>(NO_RANGE)
  const [isExporting, setIsExporting] = useState(false)

  const isRangeActive = range.from !== '' || range.to !== ''

  const trend = useMemo(() => {
    if (!isRangeActive) return analytics.completionTrend
    return analytics.completionTrend.filter(
      (point) =>
        (range.from === '' || point.date >= range.from) &&
        (range.to === '' || point.date <= range.to),
    )
  }, [analytics.completionTrend, range, isRangeActive])

  async function handleExport() {
    if (!chartsRef.current) return
    setIsExporting(true)
    try {
      await exportAnalyticsPng(
        chartsRef.current,
        {
          surface: chartTheme.surface,
          text: chartTheme.text,
          muted: chartTheme.axis,
          grid: chartTheme.grid,
        },
        `sprintdesk-analytics-${new Date().toISOString().slice(0, 10)}.png`,
      )
      toast({ title: 'Analytics exported', description: 'Saved as a PNG.', variant: 'success' })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-content sm:text-2xl">
            Sprint analytics
          </h1>
          <p className="text-sm text-content-muted">
            Derived live from the board — move a card and these update.
          </p>
        </div>
        <Button
          variant="secondary"
          className="shrink-0"
          onClick={handleExport}
          loading={isExporting}
          disabled={tasksQuery.isPending}
        >
          Export as PNG
        </Button>
      </header>

      {tasksQuery.isPending ? (
        <ChartsSkeleton />
      ) : tasksQuery.isError ? (
        <div className="rounded-xl border border-line bg-surface-raised p-8 text-center">
          <p className="text-sm font-medium text-content">Analytics could not be loaded.</p>
          <p className="mt-1 text-sm text-content-muted">
            The task service did not respond, so there is nothing to chart yet.
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => tasksQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <div ref={chartsRef} className="grid gap-4 lg:grid-cols-2">
          <VelocityChart data={analytics.velocity} />
          <StatusChart data={analytics.statusDistribution} />
          <PriorityChart data={analytics.priorityByColumn} />
          <CompletionTrendChart
            data={trend}
            filtered={isRangeActive}
            action={
              /*
                The reset button is disabled rather than unmounted: a control
                appearing mid-row used to reflow the other two as you typed.
              */
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-end">
                <Input
                  label="From"
                  type="date"
                  className="h-9 w-full py-1 text-xs sm:w-[9.5rem]"
                  value={range.from}
                  max={range.to || undefined}
                  onChange={(event) =>
                    setRange((current) => ({ ...current, from: event.target.value }))
                  }
                />
                <Input
                  label="To"
                  type="date"
                  className="h-9 w-full py-1 text-xs sm:w-[9.5rem]"
                  value={range.to}
                  min={range.from || undefined}
                  onChange={(event) =>
                    setRange((current) => ({ ...current, to: event.target.value }))
                  }
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="col-span-2 h-9 sm:col-auto"
                  disabled={!isRangeActive}
                  onClick={() => setRange(NO_RANGE)}
                >
                  Reset
                </Button>
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}
