import { useMemo } from 'react'
import { isOverdue } from '@/lib/format'
import type { Sprint, Task, TaskPriority, TaskStatus } from '@/types'
import { BOARD_COLUMNS, type BoardColumns } from '@/features/board/store/boardStore'

export interface StatusSlice {
  status: TaskStatus
  label: string
  value: number
}

export interface PriorityRow {
  column: string
  high: number
  medium: number
  low: number
}

export interface VelocityRow {
  sprint: string
  completed: number
  planned: number
}

export interface TrendPoint {
  /** ISO date (YYYY-MM-DD), used for range filtering. */
  date: string
  label: string
  completed: number
  cumulative: number
}

export interface BoardSummary {
  total: number
  done: number
  inProgress: number
  overdue: number
}

export interface BoardAnalytics {
  statusDistribution: StatusSlice[]
  priorityByColumn: PriorityRow[]
  velocity: VelocityRow[]
  completionTrend: TrendPoint[]
  summary: BoardSummary
}

const EMPTY: BoardAnalytics = {
  statusDistribution: [],
  priorityByColumn: [],
  velocity: [],
  completionTrend: [],
  summary: { total: 0, done: 0, inProgress: 0, overdue: 0 },
}

/**
 * Completion days are bucketed from UTC ISO timestamps, so every calculation
 * below stays in UTC. Parsing those dates as local time instead would shift the
 * day in any non-UTC zone — and would leave `addDays` unable to advance at all
 * in a positive offset, since the local-midnight round trip lands back on the
 * previous UTC day.
 */
const dayLabel = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/**
 * Every chart on `/analytics` is derived here, from the task entities Query
 * owns plus the column arrangement the board store owns — so moving a card on
 * `/board` changes the charts on the next render, with nothing hardcoded.
 */
export function useBoardAnalytics(
  tasks: Task[] | undefined,
  sprints: Sprint[] | undefined,
  columns: BoardColumns,
): BoardAnalytics {
  return useMemo(() => {
    if (!tasks?.length) return EMPTY

    const statusOf = new Map<number, TaskStatus>()
    for (const { status } of BOARD_COLUMNS) {
      for (const id of columns[status]) statusOf.set(id, status)
    }
    // A task the arrangement has not seen yet falls back to its stored status.
    const columnOf = (task: Task): TaskStatus => statusOf.get(task.id) ?? task.status

    const statusDistribution: StatusSlice[] = BOARD_COLUMNS.map(({ status, label }) => ({
      status,
      label,
      value: tasks.filter((task) => columnOf(task) === status).length,
    }))

    const priorityByColumn: PriorityRow[] = BOARD_COLUMNS.map(({ status, label }) => {
      const inColumn = tasks.filter((task) => columnOf(task) === status)
      const count = (priority: TaskPriority) =>
        inColumn.filter((task) => task.priority === priority).length
      return {
        column: label,
        high: count('high'),
        medium: count('medium'),
        low: count('low'),
      }
    })

    const velocity: VelocityRow[] = (sprints ?? []).map((sprint) => {
      const inSprint = tasks.filter((task) => task.sprintId === sprint.id)
      return {
        sprint: sprint.name,
        completed: inSprint.filter((task) => columnOf(task) === 'done').length,
        planned: inSprint.length,
      }
    })

    const completionsByDay = new Map<string, number>()
    for (const task of tasks) {
      if (columnOf(task) !== 'done' || !task.completedAt) continue
      const day = task.completedAt.slice(0, 10)
      completionsByDay.set(day, (completionsByDay.get(day) ?? 0) + 1)
    }

    const days = [...completionsByDay.keys()].sort()
    const completionTrend: TrendPoint[] = []
    if (days.length > 0) {
      let cumulative = 0
      // Fill the gaps so the trend line reads as time, not as a list of events.
      for (let day = days[0]!; day <= days[days.length - 1]!; day = addDays(day, 1)) {
        const completed = completionsByDay.get(day) ?? 0
        cumulative += completed
        completionTrend.push({
          date: day,
          label: dayLabel.format(new Date(`${day}T00:00:00Z`)),
          completed,
          cumulative,
        })
      }
    }

    const summary: BoardSummary = {
      total: tasks.length,
      done: tasks.filter((task) => columnOf(task) === 'done').length,
      inProgress: tasks.filter((task) => columnOf(task) === 'in-progress').length,
      overdue: tasks.filter((task) => isOverdue(task.dueDate, columnOf(task) === 'done')).length,
    }

    return { statusDistribution, priorityByColumn, velocity, completionTrend, summary }
  }, [tasks, sprints, columns])
}
