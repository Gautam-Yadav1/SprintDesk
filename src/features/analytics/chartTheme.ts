import { useMemo } from 'react'
import { useThemeStore } from '@/app/themeStore'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import type { TaskPriority, TaskStatus } from '@/types'

/**
 * Chart palette.
 *
 * Both modes are selected rather than flipped, and each set was checked against
 * the surface it renders on for lightness band, chroma, colour-vision
 * separation and contrast:
 *  - column identity is categorical (four fixed hues, never cycled);
 *  - priority is ordinal, so it is one hue stepped by rank, not four hues.
 */
const COLUMN_COLORS: Record<'light' | 'dark', Record<TaskStatus, string>> = {
  light: {
    backlog: '#4a6c8c',
    'in-progress': '#c9a876',
    review: '#b23a2e',
    done: '#3c6e47',
  },
  dark: {
    backlog: '#8fb0cd',
    'in-progress': '#d4b585',
    review: '#e07a68',
    done: '#7fb08c',
  },
}

const PRIORITY_COLORS: Record<'light' | 'dark', Record<TaskPriority, string>> = {
  light: { low: '#da9c91', medium: '#c86a5a', high: '#b23a2e' },
  dark: { low: '#7f2820', medium: '#c86a5a', high: '#e9c3bc' },
}

const SERIES: Record<'light' | 'dark', string> = {
  light: '#b23a2e',
  dark: '#e07a68',
}

/** Matches the Field Notes tokens in `index.css`, so charts sit on the card. */
const INK = {
  light: { axis: '#8c7a62', grid: '#e2d5b8', surface: '#fffdf8', text: '#2b2620' },
  dark: { axis: '#b0a086', grid: '#453c30', surface: '#2e2820', text: '#f2ebdd' },
} as const

export interface ChartTheme {
  columnColor: Record<TaskStatus, string>
  priorityColor: Record<TaskPriority, string>
  series: string
  axis: string
  grid: string
  surface: string
  text: string
  /** Recharts inline styles for the shared tooltip look. */
  tooltip: {
    contentStyle: React.CSSProperties
    labelStyle: React.CSSProperties
    itemStyle: React.CSSProperties
    cursor: { fill: string } | { stroke: string; strokeWidth: number }
  }
  animate: boolean
}

export function useChartTheme(): ChartTheme {
  const theme = useThemeStore((state) => state.theme)
  const reducedMotion = usePrefersReducedMotion()

  return useMemo(() => {
    const ink = INK[theme]
    return {
      columnColor: COLUMN_COLORS[theme],
      priorityColor: PRIORITY_COLORS[theme],
      series: SERIES[theme],
      axis: ink.axis,
      grid: ink.grid,
      surface: ink.surface,
      text: ink.text,
      tooltip: {
        contentStyle: {
          background: ink.surface,
          border: `1px solid ${ink.grid}`,
          borderRadius: 3,
          fontSize: 11,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          padding: '8px 10px',
          boxShadow: '3px 4px 0 rgb(43 38 32 / 0.12)',
        },
        labelStyle: { color: ink.text, fontWeight: 600, marginBottom: 2 },
        itemStyle: { color: ink.axis },
        cursor: { fill: ink.grid },
      },
      animate: !reducedMotion,
    }
  }, [theme, reducedMotion])
}
