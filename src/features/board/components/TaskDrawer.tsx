import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select, type SelectOption } from '@/components/ui/Select'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { formatDate, PRIORITY_TONE } from '@/lib/format'
import type { Sprint, Task, TaskEditableFields, TaskPriority, TaskStatus, User } from '@/types'
import { BOARD_COLUMNS } from '../store/boardStore'
import { useDeleteTask, useUpdateTask } from '../hooks/useTaskMutations'
import { TaskComments } from './TaskComments'

const UNASSIGNED = 0

const PRIORITY_OPTIONS: SelectOption<TaskPriority>[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export interface TaskDrawerProps {
  task: Task
  users: User[]
  userMap: Map<number, User>
  sprints: Sprint[]
  currentMember: User | undefined
  /** Column the task currently sits in, which the board store owns. */
  columnStatus: TaskStatus
  onClose: () => void
}

function toForm(task: Task): TaskEditableFields {
  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    assigneeId: task.assigneeId,
    dueDate: task.dueDate,
  }
}

/**
 * Side panel with the full task: inline editing, metadata and the comment
 * thread. Focus-trapped and dismissible with Escape, like the modal.
 */
export function TaskDrawer({
  task,
  users,
  userMap,
  sprints,
  currentMember,
  columnStatus,
  onClose,
}: TaskDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true)

  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const [form, setForm] = useState<TaskEditableFields>(() => toForm(task))
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [titleError, setTitleError] = useState<string>()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // While the delete dialog is open it owns Escape.
      if (event.key === 'Escape' && !confirmingDelete) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, confirmingDelete])

  const assigneeOptions = useMemo<SelectOption<number>[]>(
    () => [
      { value: UNASSIGNED, label: 'Unassigned' },
      ...users.map((user) => ({
        value: user.id,
        label: user.name,
        adornment: <Avatar name={user.name} src={user.avatar} size="xs" decorative />,
      })),
    ],
    [users],
  )

  const isDirty = useMemo(() => {
    const original = toForm(task)
    return (Object.keys(original) as (keyof TaskEditableFields)[]).some(
      (key) => original[key] !== form[key],
    )
  }, [task, form])

  const sprint = sprints.find((candidate) => candidate.id === task.sprintId)
  const columnLabel =
    BOARD_COLUMNS.find((column) => column.status === columnStatus)?.label ?? columnStatus
  const assignee = task.assigneeId === null ? undefined : userMap.get(task.assigneeId)

  function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!form.title.trim()) {
      setTitleError('A task needs a title.')
      return
    }
    setTitleError(undefined)
    updateTask.mutate({ id: task.id, patch: { ...form, title: form.title.trim() } })
  }

  function handleDelete() {
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        setConfirmingDelete(false)
        onClose()
      },
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Task details: ${task.title}`}
        tabIndex={-1}
        className="sd-scrollbar relative flex h-dvh w-full max-w-md animate-slide-in-right flex-col overflow-y-auto border-l border-line bg-[var(--card)] shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start gap-2 border-b-2 border-line bg-[var(--card)] px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-content-muted">
              {sprint?.name ?? 'No sprint'} &middot; {columnLabel}
            </p>
            <h2 className="truncate text-base font-semibold text-content">{task.title}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close task details">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="m6 6 8 8M14 6l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </Button>
        </header>

        <div className="flex-1 space-y-5 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority} priority</Badge>
            <Badge tone={columnStatus === 'done' ? 'success' : 'brand'}>{columnLabel}</Badge>
            <span className="text-xs text-content-muted">Due {formatDate(task.dueDate)}</span>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Title"
              required
              value={form.title}
              error={titleError}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Priority"
                value={form.priority}
                options={PRIORITY_OPTIONS}
                onChange={(priority) => setForm((current) => ({ ...current, priority }))}
              />
              <Input
                label="Due date"
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dueDate: event.target.value }))
                }
              />
            </div>
            <Select
              label="Assignee"
              value={form.assigneeId ?? UNASSIGNED}
              options={assigneeOptions}
              onChange={(assigneeId) =>
                setForm((current) => ({
                  ...current,
                  assigneeId: assigneeId === UNASSIGNED ? null : assigneeId,
                }))
              }
            />

            <div className="flex items-center gap-2">
              <Button type="submit" loading={updateTask.isPending} disabled={!isDirty}>
                Save changes
              </Button>
              {isDirty && (
                <Button variant="ghost" onClick={() => setForm(toForm(task))}>
                  Reset
                </Button>
              )}
              <Button variant="danger" className="ml-auto" onClick={() => setConfirmingDelete(true)}>
                Delete
              </Button>
            </div>
          </form>

          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-sunken p-3 text-xs">
            <div>
              <dt className="text-content-muted">Assignee</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-content">
                {assignee ? (
                  <>
                    <Avatar name={assignee.name} src={assignee.avatar} size="xs" decorative />
                    {assignee.name}
                  </>
                ) : (
                  'Unassigned'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-content-muted">Completed</dt>
              <dd className="mt-1 text-content">
                {task.completedAt ? formatDate(task.completedAt) : 'Not yet'}
              </dd>
            </div>
          </dl>

          <TaskComments taskId={task.id} userMap={userMap} currentMember={currentMember} />
        </div>
      </div>

      <Modal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete this task?"
        description={`${task.title} and its comments will be removed from the board. This cannot be undone.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteTask.isPending} onClick={handleDelete}>
              Delete task
            </Button>
          </>
        }
      />
    </div>,
    document.body,
  )
}
