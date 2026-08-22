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
    backlog: '#2a78d6',
    'in-progress': '#eda100',
    review: '#4a3aa7',
    done: '#1baf7a',
  },
  dark: {
    backlog: '#3987e5',
    'in-progress': '#c98500',
    review: '#9085e9',
    done: '#199e70',
  },
}

const PRIORITY_COLORS: Record<'light' | 'dark', Record<TaskPriority, string>> = {
  light: { low: '#86b6ef', medium: '#2a78d6', high: '#104281' },
  dark: { low: '#184f95', medium: '#3987e5', high: '#9ec5f4' },
}

const SERIES: Record<'light' | 'dark', string> = {
  light: '#2a78d6',
  dark: '#3987e5',
}

const INK = {
  light: { axis: '#5a6980', grid: '#e2e8f0', surface: '#ffffff', text: '#0f172a' },
  dark: { axis: '#9aa7bd', grid: '#2d374b', surface: '#161d2c', text: '#e8eef7' },
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
          borderRadius: 10,
          fontSize: 12,
          padding: '8px 10px',
          boxShadow: '0 8px 24px rgb(15 23 42 / 0.12)',
        },
        labelStyle: { color: ink.text, fontWeight: 600, marginBottom: 2 },
        itemStyle: { color: ink.axis },
        cursor: { fill: ink.grid },
      },
      animate: !reducedMotion,
    }
  }, [theme, reducedMotion])
}
