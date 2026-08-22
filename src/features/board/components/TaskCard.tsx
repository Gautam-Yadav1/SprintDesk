import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { formatDate, isOverdue, PRIORITY_TONE } from '@/lib/format'
import type { Task, TaskPriority, User } from '@/types'

/**
 * The sticky tab lapping a card's top edge, colour-coded by priority. The fills
 * are plain theme classes from `index.css` rather than Tailwind colour
 * utilities: the tab is the one element whose whole job is to be visible, so it
 * should not depend on the build config being in sync to have a colour at all.
 */
const PRIORITY_TAB: Record<TaskPriority, string> = {
  high: 'fn-tab--high',
  medium: 'fn-tab--medium',
  low: 'fn-tab--low',
}

export interface TaskCardProps {
  task: Task
  assignee: User | undefined
  onOpen: (taskId: number) => void
}

/** Presentational card, also used inside the drag overlay. */
export const TaskCardContent = memo(function TaskCardContent({
  task,
  assignee,
  onOpen,
  dragHandle,
}: TaskCardProps & { dragHandle?: React.ReactNode }) {
  const overdue = isOverdue(task.dueDate, task.status === 'done')

  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => onOpen(task.id)}
          className="min-w-0 flex-1 rounded text-left text-[0.95rem] font-semibold leading-snug text-content hover:text-brand-600 dark:hover:text-brand-400"
        >
          {task.title}
        </button>
        {dragHandle}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
      </div>

      {/* Assignee left, due date right, over a dashed rule — the ruled-off
          footer of a filing card. */}
      <div className="flex items-center gap-2 border-t border-dashed border-line pt-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <Avatar
            name={assignee?.name ?? 'Unassigned'}
            src={assignee?.avatar}
            size="xs"
            decorative
          />
          <span className="sr-only">Assigned to </span>
          <span className="sd-label max-w-[7rem] truncate text-content-muted">
            {assignee?.name ?? 'Unassigned'}
          </span>
        </span>
        <span
          className={cn(
            'sd-figure ml-auto inline-flex shrink-0 items-center gap-1 text-[11px]',
            overdue ? 'font-bold text-brand-500' : 'text-content-muted',
          )}
        >
          <span className="sr-only">{overdue ? 'Overdue, due' : 'Due'} </span>
          {formatDate(task.dueDate)}
        </span>
      </div>
    </div>
  )
})

/**
 * Sortable board card. The title is a button (opens the drawer) and dragging
 * lives on a dedicated handle, so keyboard users can do both — Enter on the
 * handle starts a dnd-kit keyboard drag, Enter on the title opens the task.
 */
export const TaskCard = memo(function TaskCard({ task, assignee, onOpen }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && 'opacity-40')}
    >
      {/* The tilt lives here rather than on the <li>, so dnd-kit's drag
          transform and the hand-pinned rotation never overwrite each other. */}
      <div className={cn('fn-card relative rounded-md p-3', isDragging && 'shadow-none')}>
        <span className={cn('fn-tab', PRIORITY_TAB[task.priority])} aria-hidden="true" />
        <TaskCardContent
          task={task}
          assignee={assignee}
          onOpen={onOpen}
          dragHandle={
            <button
              type="button"
              {...attributes}
              {...listeners}
              aria-label={`Reorder ${task.title}`}
              aria-roledescription="Drag handle"
              className={cn(
                // 44px on touch, tightened up on pointer devices. The negative
                // margins keep the larger target from padding out the card.
                'sd-drag-handle -my-1.5 -mr-1.5 grid h-11 w-11 shrink-0 place-items-center rounded-md',
                'text-content-muted/70 transition-colors hover:bg-surface-sunken hover:text-content',
                'cursor-grab active:cursor-grabbing active:bg-surface-sunken',
                'sm:-my-1 sm:-mr-1 sm:h-8 sm:w-8',
              )}
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <circle cx="6" cy="4" r="1.2" />
                <circle cx="10" cy="4" r="1.2" />
                <circle cx="6" cy="8" r="1.2" />
                <circle cx="10" cy="8" r="1.2" />
                <circle cx="6" cy="12" r="1.2" />
                <circle cx="10" cy="12" r="1.2" />
              </svg>
            </button>
          }
        />
      </div>
    </li>
  )
})
