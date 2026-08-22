import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useChartTheme } from '../chartTheme'
import { ChartLegend } from './ChartLegend'
import type { StatusSlice } from '../hooks/useBoardAnalytics'
import { ChartCard } from './ChartCard'

/**
 * Distribution across the four board columns. Every slice is also labelled with
 * its value in the legend, so identity never rests on colour alone.
 */
export function StatusChart({ data }: { data: StatusSlice[] }) {
  const theme = useChartTheme()
  const total = data.reduce((sum, slice) => sum + slice.value, 0)

  return (
    <ChartCard
      title="Task status"
      description="How the board is distributed right now"
      isEmpty={total === 0}
      emptyMessage="There are no tasks on the board."
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <ResponsiveContainer width="100%" height={200} className="max-w-[260px]">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="58%"
              outerRadius="86%"
              paddingAngle={2}
              stroke={theme.surface}
              strokeWidth={2}
              isAnimationActive={theme.animate}
            >
              {data.map((slice) => (
                <Cell key={slice.status} fill={theme.columnColor[slice.status]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={theme.tooltip.contentStyle}
              labelStyle={theme.tooltip.labelStyle}
              itemStyle={theme.tooltip.itemStyle}
              formatter={(value, name) => [
                `${Number(value)} task${Number(value) === 1 ? '' : 's'}`,
                String(name),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <ChartLegend
          layout="column"
          items={data.map((slice) => ({
            label: slice.label,
            color: theme.columnColor[slice.status],
            value: slice.value,
            share: total === 0 ? '0%' : `${Math.round((slice.value / total) * 100)}%`,
          }))}
        />
      </div>
    </ChartCard>
  )
}
