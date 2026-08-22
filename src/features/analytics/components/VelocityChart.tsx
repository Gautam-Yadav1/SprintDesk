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
import type { VelocityRow } from '../hooks/useBoardAnalytics'
import { ChartCard } from './ChartCard'

/** Completed tasks per sprint — one series, so the title carries identity. */
export function VelocityChart({ data }: { data: VelocityRow[] }) {
  const theme = useChartTheme()

  return (
    <ChartCard
      title="Sprint velocity"
      description="Tasks completed in each sprint"
      isEmpty={data.length === 0}
      emptyMessage="No sprints have been loaded yet."
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} accessibilityLayer>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis
            dataKey="sprint"
            tickLine={false}
            axisLine={{ stroke: theme.grid }}
            tick={{ fill: theme.axis, fontSize: 12 }}
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
            formatter={(value, _name, item) => [
              `${Number(value)} of ${(item.payload as VelocityRow).planned} planned`,
              'Completed',
            ]}
          />
          <Bar
            dataKey="completed"
            name="Completed"
            fill={theme.series}
            radius={[4, 4, 0, 0]}
            maxBarSize={56}
            isAnimationActive={theme.animate}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
