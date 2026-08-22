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
        // A corkboard lane: tinted board stock holding the pinned cards.
        'fn-lane flex min-w-0 flex-col rounded-md transition-colors',
        // One near-full-width lane per swipe on phones, a grid cell above it.
        'w-[85vw] max-w-[21rem] shrink-0 snap-start',
        'sm:w-auto sm:max-w-none sm:shrink',
        isOver && 'border-brand-400 dark:border-brand-500',
      )}
    >
      {/* Lane heading: the name written by hand, the count typed, ruled off
          underneath with a dashed line. */}
      <h2 className="mx-3 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-dashed border-line text-content">
        <span className="truncate font-display text-xl font-bold leading-none">{label}</span>
        <span className="sd-figure shrink-0 text-xs text-content-muted">
          {filtered ? `${tasks.length}/${totalCount}` : totalCount}
          <span className="sr-only"> tasks</span>
        </span>
      </h2>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-b-md px-3 pb-3 pt-4 transition-colors',
          isOver && 'bg-brand-500/[0.08]',
        )}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <ul className="fn-pinned flex min-h-[4.5rem] flex-col gap-[18px]">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assignee={task.assigneeId ? userMap.get(task.assigneeId) : undefined}
                onOpen={onOpenTask}
              />
            ))}
            {tasks.length === 0 && (
              <li className="sd-label grid h-[4.5rem] place-items-center rounded-md border border-dashed border-line text-content-muted">
                {filtered ? 'No matching tasks' : 'Drop tasks here'}
              </li>
            )}
          </ul>
        </SortableContext>
      </div>
    </section>
  )
}
