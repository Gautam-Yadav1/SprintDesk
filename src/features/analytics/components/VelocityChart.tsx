import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartTheme } from '../chartTheme'
import type { VelocityRow } from '../hooks/useBoardAnalytics'
import { ChartCard } from './ChartCard'

/** Figures on a chart are typed, like every other number in the app. */
const MONO = "'JetBrains Mono', ui-monospace, monospace"


/** Completed tasks per sprint — one series, so the title carries identity. */
export function VelocityChart({ data }: { data: VelocityRow[] }) {
  const theme = useChartTheme()
  // Presentational only: names the peak bar for the margin note. No state, no
  // fetching — it reads the same rows the chart is already rendering.
  const best = data.reduce<VelocityRow | null>(
    (peak, row) => (peak === null || row.completed > peak.completed ? row : peak),
    null,
  )

  return (
    <ChartCard
      title="Sprint velocity"
      description="Tasks completed in each sprint"
      isEmpty={data.length === 0}
      emptyMessage="No sprints have been loaded yet."
    >
      <div className="relative">
        {best && (
          <span className="fn-note absolute right-1 top-0 z-10 text-lg" aria-hidden="true">
            best so far: {best.sprint} ↗
          </span>
        )}
        <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} accessibilityLayer>
          <CartesianGrid stroke={theme.grid} strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="sprint"
            tickLine={false}
            axisLine={{ stroke: theme.text, strokeWidth: 1 }}
            tick={{ fill: theme.axis, fontSize: 11, fontFamily: MONO }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fill: theme.axis, fontSize: 11, fontFamily: MONO }}
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
            radius={[2, 2, 0, 0]}
            maxBarSize={48}
            isAnimationActive={theme.animate}
          >
            <LabelList
              dataKey="completed"
              position="top"
              offset={8}
              fill={theme.text}
              fontSize={11}
              fontFamily={MONO}
            />
          </Bar>
        </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
