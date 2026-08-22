import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/lib/cn'
import type { Task, TaskStatus, User } from '@/types'
import { TaskCard } from './TaskCard'

export const COLUMN_DROPPABLE_PREFIX = 'column:'
const columnDroppableId = (status: TaskStatus) => `${COLUMN_DROPPABLE_PREFIX}${status}`

export interface BoardColumnProps {
  status: TaskStatus
  label: string
  tasks: Task[]
  /** Total before board filters, so a filtered column can show "3 of 8". */
  totalCount: number
  userMap: Map<number, User>
  onOpenTask: (taskId: number) => void
}

export function BoardColumn({
  status,
  label,
  tasks,
  totalCount,
  userMap,
  onOpenTask,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDroppableId(status) })
  const filtered = tasks.length !== totalCount

  return (
    <section
      aria-label={`${label} column`}
      className={cn(
        'flex min-w-0 flex-col rounded-xl border border-line bg-surface-sunken/60 transition-colors',
        // One near-full-width lane per swipe on phones, a grid cell above it.
        'w-[85vw] max-w-[21rem] shrink-0 snap-start',
        'sm:w-auto sm:max-w-none sm:shrink',
        isOver && 'border-brand-400 dark:border-brand-500',
      )}
    >
      <h2 className="flex h-11 shrink-0 items-center justify-between gap-2 px-3 text-sm font-semibold text-content">
        <span className="truncate">{label}</span>
        <span className="shrink-0 rounded-full bg-surface-raised px-2 py-0.5 text-xs font-medium tabular-nums text-content-muted">
          {filtered ? `${tasks.length} of ${totalCount}` : totalCount}
          <span className="sr-only"> tasks</span>
        </span>
      </h2>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-b-xl px-2 pb-2 transition-colors',
          isOver && 'bg-brand-50/70 dark:bg-brand-900/20',
        )}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex min-h-[4.5rem] flex-col gap-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assignee={task.assigneeId ? userMap.get(task.assigneeId) : undefined}
                onOpen={onOpenTask}
              />
            ))}
            {tasks.length === 0 && (
              <li className="grid h-[4.5rem] place-items-center rounded-lg border border-dashed border-line text-xs text-content-muted">
                {filtered ? 'No matching tasks' : 'Drop tasks here'}
              </li>
            )}
          </ul>
        </SortableContext>
      </div>
    </section>
  )
}
