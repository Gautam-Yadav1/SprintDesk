import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartTheme } from '../chartTheme'
import type { TrendPoint } from '../hooks/useBoardAnalytics'
import { ChartCard } from './ChartCard'

export interface CompletionTrendChartProps {
  data: TrendPoint[]
  /** Date-range controls rendered in the card header. */
  action?: ReactNode
  /** Distinguishes "nothing completed yet" from "nothing in this range". */
  filtered?: boolean
}

/** Cumulative completions over time; the daily count rides along in the tooltip. */
export function CompletionTrendChart({ data, action, filtered }: CompletionTrendChartProps) {
  const theme = useChartTheme()

  return (
    <ChartCard
      title="Completion trend"
      description="Cumulative tasks completed over time"
      action={action}
      isEmpty={data.length === 0}
      emptyMessage={
        filtered
          ? 'No tasks were completed in the selected range.'
          : 'No tasks have been completed yet.'
      }
    >
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} accessibilityLayer>
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.series} stopOpacity={0.35} />
              <stop offset="100%" stopColor={theme.series} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: theme.grid }}
            tick={{ fill: theme.axis, fontSize: 11 }}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fill: theme.axis, fontSize: 12 }}
          />
          <Tooltip
            cursor={{ stroke: theme.axis, strokeWidth: 1 }}
            contentStyle={theme.tooltip.contentStyle}
            labelStyle={theme.tooltip.labelStyle}
            itemStyle={theme.tooltip.itemStyle}
            formatter={(value, _name, item) => [
              `${Number(value)} total (+${(item.payload as TrendPoint).completed} that day)`,
              'Completed',
            ]}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            name="Completed"
            stroke={theme.series}
            strokeWidth={2}
            fill="url(#trend-fill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: theme.surface }}
            isAnimationActive={theme.animate}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
