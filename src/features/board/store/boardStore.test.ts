import { beforeEach, describe, expect, it } from 'vitest'
import type { Task, TaskStatus } from '@/types'
import { emptyColumns, findColumnOf, useBoardStore } from './boardStore'

function makeTask(id: number, status: TaskStatus, order: number): Task {
  return {
    id,
    title: `Task ${id}`,
    description: '',
    status,
    priority: 'medium',
    assigneeId: 1,
    dueDate: '2026-08-30',
    sprintId: 3,
    order,
    createdAt: '2026-08-01T09:00:00Z',
    completedAt: null,
    updatedAt: '2026-08-01T09:00:00Z',
  }
}

const TASKS: Task[] = [
  makeTask(1, 'backlog', 1),
  makeTask(2, 'backlog', 2),
  makeTask(3, 'in-progress', 1),
  makeTask(4, 'review', 1),
  makeTask(5, 'done', 1),
]

function seed() {
  useBoardStore.getState().syncWithTasks(TASKS)
}

function columns() {
  return useBoardStore.getState().columns
}

describe('board store', () => {
  beforeEach(() => {
    useBoardStore.setState({ columns: emptyColumns(), lastMove: null })
  })

  describe('syncWithTasks', () => {
    it('seeds each column from the task status, ordered by task order', () => {
      seed()

      expect(columns()).toEqual({
        backlog: [1, 2],
        'in-progress': [3],
        review: [4],
        done: [5],
      })
    })

    it('keeps the existing arrangement and appends only unknown tasks', () => {
      seed()
      useBoardStore.getState().moveTask(1, 'done', 0)

      useBoardStore.getState().syncWithTasks([...TASKS, makeTask(6, 'review', 2)])

      expect(columns().done).toEqual([1, 5])
      expect(columns().backlog).toEqual([2])
      expect(columns().review).toEqual([4, 6])
    })

    it('drops ids that no longer exist in the task list', () => {
      seed()

      useBoardStore.getState().syncWithTasks(TASKS.filter((task) => task.id !== 3))

      expect(columns()['in-progress']).toEqual([])
      expect(findColumnOf(columns(), 3)).toBeNull()
    })
  })

  describe('addTask', () => {
    it('puts a new task at the top of its column', () => {
      seed()

      useBoardStore.getState().addTask(9, 'backlog')

      expect(columns().backlog).toEqual([9, 1, 2])
    })

    it('ignores a task that is already on the board', () => {
      seed()

      useBoardStore.getState().addTask(1, 'done')

      expect(columns().done).toEqual([5])
      expect(columns().backlog).toEqual([1, 2])
    })
  })

  describe('moveTask', () => {
    it('reorders within a column', () => {
      seed()

      useBoardStore.getState().moveTask(2, 'backlog', 0)

      expect(columns().backlog).toEqual([2, 1])
    })

    it('moves across columns at the requested index', () => {
      seed()

      useBoardStore.getState().moveTask(1, 'in-progress', 0)

      expect(columns().backlog).toEqual([2])
      expect(columns()['in-progress']).toEqual([1, 3])
    })

    it('clamps an index past the end of the target column', () => {
      seed()

      useBoardStore.getState().moveTask(1, 'done', 99)

      expect(columns().done).toEqual([5, 1])
    })

    it('records the move so it can be undone', () => {
      seed()

      useBoardStore.getState().moveTask(1, 'review', 0)

      expect(useBoardStore.getState().lastMove).toEqual({
        taskId: 1,
        from: { status: 'backlog', index: 0 },
        to: { status: 'review', index: 0 },
      })
    })

    it('is a no-op when the task does not move', () => {
      seed()

      useBoardStore.getState().moveTask(1, 'backlog', 0)

      expect(useBoardStore.getState().lastMove).toBeNull()
      expect(columns().backlog).toEqual([1, 2])
    })

    it('ignores a task that is not on the board', () => {
      seed()

      useBoardStore.getState().moveTask(42, 'done', 0)

      expect(columns().done).toEqual([5])
    })
  })

  describe('undoLastMove', () => {
    it('restores the previous column and index, and reports what to write back', () => {
      seed()
      useBoardStore.getState().moveTask(2, 'done', 0)

      const restored = useBoardStore.getState().undoLastMove()

      expect(restored).toEqual({ taskId: 2, status: 'backlog' })
      expect(columns().backlog).toEqual([1, 2])
      expect(columns().done).toEqual([5])
      expect(useBoardStore.getState().lastMove).toBeNull()
    })

    it('returns null when there is nothing to undo', () => {
      seed()

      expect(useBoardStore.getState().undoLastMove()).toBeNull()
    })
  })

  describe('removeTask', () => {
    it('takes the task off the board', () => {
      seed()

      useBoardStore.getState().removeTask(1)

      expect(columns().backlog).toEqual([2])
      expect(findColumnOf(columns(), 1)).toBeNull()
    })

    it('clears a pending undo that pointed at the deleted task', () => {
      seed()
      useBoardStore.getState().moveTask(1, 'done', 0)

      useBoardStore.getState().removeTask(1)

      expect(useBoardStore.getState().lastMove).toBeNull()
    })

    it('keeps a pending undo for a different task', () => {
      seed()
      useBoardStore.getState().moveTask(1, 'done', 0)

      useBoardStore.getState().removeTask(4)

      expect(useBoardStore.getState().lastMove?.taskId).toBe(1)
    })
  })
})
