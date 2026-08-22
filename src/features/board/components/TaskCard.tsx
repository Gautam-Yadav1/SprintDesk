import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { formatDate, isOverdue, PRIORITY_TONE } from '@/lib/format'
import type { Task, User } from '@/types'

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
          className="min-w-0 flex-1 rounded text-left text-sm font-medium leading-snug text-content hover:text-brand-700 dark:hover:text-brand-300"
        >
          {task.title}
        </button>
        {dragHandle}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs',
            overdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-content-muted',
          )}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M2 6.5h12M5.5 2v2M10.5 2v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span className="sr-only">{overdue ? 'Overdue, due' : 'Due'} </span>
          {formatDate(task.dueDate)}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <Avatar
            name={assignee?.name ?? 'Unassigned'}
            src={assignee?.avatar}
            size="xs"
            decorative
          />
          <span className="sr-only">Assigned to </span>
          <span className="max-w-[6.5rem] truncate text-xs text-content-muted">
            {assignee?.name ?? 'Unassigned'}
          </span>
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
      className={cn(
        'rounded-xl border border-line bg-surface-raised p-3 shadow-sm',
        // The card left behind is the drop placeholder; the overlay is the
        // one under the finger, so this one drops its lift shadow too.
        isDragging && 'opacity-40 shadow-none',
      )}
    >
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
              'sd-drag-handle -my-1.5 -mr-1.5 grid h-11 w-11 shrink-0 place-items-center rounded-lg',
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
    </li>
  )
})
