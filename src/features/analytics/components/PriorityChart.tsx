import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartTheme } from '../chartTheme'
import type { PriorityRow } from '../hooks/useBoardAnalytics'
import { ChartCard } from './ChartCard'
import { ChartLegend } from './ChartLegend'

const PRIORITIES = ['high', 'medium', 'low'] as const
const LABELS: Record<(typeof PRIORITIES)[number], string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

/**
 * Priority mix per column. Priority is ordered, so the stack uses one hue
 * stepped by rank rather than three unrelated colours, and the legend labels
 * carry the identity.
 */
export function PriorityChart({ data }: { data: PriorityRow[] }) {
  const theme = useChartTheme()
  const isEmpty = data.every((row) => row.high + row.medium + row.low === 0)

  return (
    <ChartCard
      title="Priority breakdown"
      description="Priority mix inside each column"
      isEmpty={isEmpty}
      emptyMessage="There are no tasks on the board."
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} accessibilityLayer>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis
            dataKey="column"
            tickLine={false}
            axisLine={{ stroke: theme.grid }}
            tick={{ fill: theme.axis, fontSize: 11 }}
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fill: theme.axis, fontSize: 12 }}
          />
          <Tooltip
            cursor={theme.tooltip.cursor}
            contentStyle={theme.tooltip.contentStyle}
            labelStyle={theme.tooltip.labelStyle}
            itemStyle={theme.tooltip.itemStyle}
          />
          {PRIORITIES.map((priority) => (
            <Bar
              key={priority}
              dataKey={priority}
              name={LABELS[priority]}
              stackId="priority"
              fill={theme.priorityColor[priority]}
              // A 2px surface-coloured edge keeps stacked segments visually separate.
              stroke={theme.surface}
              strokeWidth={2}
              maxBarSize={64}
              isAnimationActive={theme.animate}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <ChartLegend
        className="mt-3"
        items={PRIORITIES.map((priority) => ({
          label: LABELS[priority],
          color: theme.priorityColor[priority],
        }))}
      />
    </ChartCard>
  )
}
