import type { TaskPriority } from '@/types'

export interface BoardFilterValue {
  priority: TaskPriority | 'all'
  /** User id, `unassigned`, or `all`. */
  assignee: number | 'all' | 'unassigned'
}

export const NO_FILTERS: BoardFilterValue = { priority: 'all', assignee: 'all' }
