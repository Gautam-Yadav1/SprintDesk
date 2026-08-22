import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/lib/storage'
import type { Task, TaskStatus } from '@/types'

export const BOARD_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'review', label: 'Review' },
  { status: 'done', label: 'Done' },
]

/** Ordered task ids per column — the board's arrangement, and nothing else. */
export type BoardColumns = Record<TaskStatus, number[]>

interface MoveRecord {
  taskId: number
  from: { status: TaskStatus; index: number }
  to: { status: TaskStatus; index: number }
}

interface BoardState {
  columns: BoardColumns
  /** Last drag, kept so the board can offer a single-step undo. */
  lastMove: MoveRecord | null
  /**
   * Reconciles the arrangement with the tasks returned by the query layer:
   * unknown tasks are appended to the column matching their stored status,
   * ids that no longer exist are dropped, and existing order is preserved.
   */
  syncWithTasks: (tasks: Task[]) => void
  moveTask: (taskId: number, toStatus: TaskStatus, toIndex: number) => void
  addTask: (taskId: number, status: TaskStatus) => void
  removeTask: (taskId: number) => void
  /** Reverts the last move and returns what the caller must write back. */
  undoLastMove: () => { taskId: number; status: TaskStatus } | null
}

export function emptyColumns(): BoardColumns {
  return { backlog: [], 'in-progress': [], review: [], done: [] }
}

export function findColumnOf(columns: BoardColumns, taskId: number): TaskStatus | null {
  for (const { status } of BOARD_COLUMNS) {
    if (columns[status].includes(taskId)) return status
  }
  return null
}

function withoutTask(columns: BoardColumns, taskId: number): BoardColumns {
  return {
    backlog: columns.backlog.filter((id) => id !== taskId),
    'in-progress': columns['in-progress'].filter((id) => id !== taskId),
    review: columns.review.filter((id) => id !== taskId),
    done: columns.done.filter((id) => id !== taskId),
  }
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      columns: emptyColumns(),
      lastMove: null,

      syncWithTasks: (tasks) => {
        const known = new Set(tasks.map((task) => task.id))
        const current = get().columns

        const next = emptyColumns()
        const placed = new Set<number>()
        for (const { status } of BOARD_COLUMNS) {
          for (const id of current[status]) {
            if (known.has(id) && !placed.has(id)) {
              next[status].push(id)
              placed.add(id)
            }
          }
        }

        const missing = tasks
          .filter((task) => !placed.has(task.id))
          .sort((a, b) => a.order - b.order)
        for (const task of missing) next[task.status].push(task.id)

        set({ columns: next })
      },

      moveTask: (taskId, toStatus, toIndex) => {
        const columns = get().columns
        const fromStatus = findColumnOf(columns, taskId)
        if (!fromStatus) return

        const fromIndex = columns[fromStatus].indexOf(taskId)
        const stripped = withoutTask(columns, taskId)
        const target = [...stripped[toStatus]]
        const index = Math.max(0, Math.min(toIndex, target.length))
        target.splice(index, 0, taskId)

        if (fromStatus === toStatus && fromIndex === index) return

        set({
          columns: { ...stripped, [toStatus]: target },
          lastMove: {
            taskId,
            from: { status: fromStatus, index: fromIndex },
            to: { status: toStatus, index },
          },
        })
      },

      addTask: (taskId, status) => {
        const columns = get().columns
        if (findColumnOf(columns, taskId)) return
        set({ columns: { ...columns, [status]: [taskId, ...columns[status]] } })
      },

      removeTask: (taskId) => {
        const { columns, lastMove } = get()
        if (!findColumnOf(columns, taskId)) return
        set({
          columns: withoutTask(columns, taskId),
          // A removed task can no longer be un-moved.
          lastMove: lastMove?.taskId === taskId ? null : lastMove,
        })
      },

      undoLastMove: () => {
        const { columns, lastMove } = get()
        if (!lastMove) return null

        const stripped = withoutTask(columns, lastMove.taskId)
        const target = [...stripped[lastMove.from.status]]
        const index = Math.max(0, Math.min(lastMove.from.index, target.length))
        target.splice(index, 0, lastMove.taskId)

        set({
          columns: { ...stripped, [lastMove.from.status]: target },
          lastMove: null,
        })
        return { taskId: lastMove.taskId, status: lastMove.from.status }
      },
    }),
    {
      name: STORAGE_KEYS.board,
      storage: createJSONStorage(() => window.localStorage),
      // The arrangement persists; a pending undo is per-session.
      partialize: (state) => ({ columns: state.columns }),
    },
  ),
)
