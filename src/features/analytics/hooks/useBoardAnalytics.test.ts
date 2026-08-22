import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Sprint, Task, TaskStatus } from '@/types'
import { emptyColumns, type BoardColumns } from '@/features/board/store/boardStore'
import { useBoardAnalytics } from './useBoardAnalytics'

function makeTask(overrides: Partial<Task> & { id: number }): Task {
  return {
    title: `Task ${overrides.id}`,
    description: '',
    status: 'backlog',
    priority: 'medium',
    assigneeId: 1,
    dueDate: '2026-08-30',
    sprintId: 1,
    order: overrides.id,
    createdAt: '2026-08-01T09:00:00Z',
    completedAt: null,
    updatedAt: '2026-08-01T09:00:00Z',
    ...overrides,
  }
}

function columnsFrom(arrangement: Partial<Record<TaskStatus, number[]>>): BoardColumns {
  return { ...emptyColumns(), ...arrangement }
}

const SPRINTS: Sprint[] = [
  { id: 1, name: 'Sprint 1', startDate: '2026-07-20', endDate: '2026-07-31' },
  { id: 2, name: 'Sprint 2', startDate: '2026-08-03', endDate: '2026-08-14' },
]

describe('useBoardAnalytics', () => {
  it('derives status counts from the board arrangement, not the stored status', () => {
    const tasks = [
      makeTask({ id: 1, status: 'backlog' }),
      makeTask({ id: 2, status: 'backlog' }),
    ]
    // Task 2 was dragged to Done; its entity still says "backlog".
    const columns = columnsFrom({ backlog: [1], done: [2] })

    const { result } = renderHook(() => useBoardAnalytics(tasks, SPRINTS, columns))

    expect(
      Object.fromEntries(result.current.statusDistribution.map((s) => [s.status, s.value])),
    ).toMatchObject({ backlog: 1, done: 1 })
    expect(result.current.summary.done).toBe(1)
  })

  it('counts velocity per sprint from the done column', () => {
    const tasks = [
      makeTask({ id: 1, sprintId: 1 }),
      makeTask({ id: 2, sprintId: 1 }),
      makeTask({ id: 3, sprintId: 2 }),
    ]
    const columns = columnsFrom({ done: [1, 3], backlog: [2] })

    const { result } = renderHook(() => useBoardAnalytics(tasks, SPRINTS, columns))

    expect(result.current.velocity).toEqual([
      { sprint: 'Sprint 1', completed: 1, planned: 2 },
      { sprint: 'Sprint 2', completed: 1, planned: 1 },
    ])
  })

  it('builds a continuous, cumulative completion trend that fills empty days', () => {
    const tasks = [
      makeTask({ id: 1, completedAt: '2026-08-17T10:00:00Z' }),
      makeTask({ id: 2, completedAt: '2026-08-19T22:30:00Z' }),
      makeTask({ id: 3, completedAt: '2026-08-19T08:00:00Z' }),
    ]
    const columns = columnsFrom({ done: [1, 2, 3] })

    const { result } = renderHook(() => useBoardAnalytics(tasks, SPRINTS, columns))

    // Terminates and advances a day at a time in any local timezone.
    expect(result.current.completionTrend.map((point) => point.date)).toEqual([
      '2026-08-17',
      '2026-08-18',
      '2026-08-19',
    ])
    expect(result.current.completionTrend.map((point) => point.completed)).toEqual([1, 0, 2])
    expect(result.current.completionTrend.map((point) => point.cumulative)).toEqual([1, 1, 3])
  })

  it('ignores completion stamps for tasks dragged back out of Done', () => {
    const tasks = [makeTask({ id: 1, completedAt: '2026-08-17T10:00:00Z' })]
    const columns = columnsFrom({ review: [1] })

    const { result } = renderHook(() => useBoardAnalytics(tasks, SPRINTS, columns))

    expect(result.current.completionTrend).toEqual([])
  })

  it('returns the empty shape when there are no tasks', () => {
    const { result } = renderHook(() => useBoardAnalytics([], SPRINTS, emptyColumns()))

    expect(result.current.summary).toEqual({ total: 0, done: 0, inProgress: 0, overdue: 0 })
    expect(result.current.statusDistribution).toEqual([])
  })
})
