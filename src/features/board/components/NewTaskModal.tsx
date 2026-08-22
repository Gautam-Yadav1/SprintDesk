import { useMemo, useState, type FormEvent } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select, type SelectOption } from '@/components/ui/Select'
import { toDateInputValue } from '@/lib/format'
import type { Sprint, TaskPriority, User } from '@/types'
import { useCreateTask } from '../hooks/useTaskMutations'

const UNASSIGNED = 0

const PRIORITY_OPTIONS: SelectOption<TaskPriority>[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export interface NewTaskModalProps {
  open: boolean
  onClose: () => void
  users: User[]
  sprints: Sprint[]
}

function defaultDueDate(): string {
  const inAWeek = new Date()
  inAWeek.setDate(inAWeek.getDate() + 7)
  return toDateInputValue(inAWeek)
}

/** New tasks always land at the top of Backlog, mirroring how teams triage. */
export function NewTaskModal({ open, onClose, users, sprints }: NewTaskModalProps) {
  const createTask = useCreateTask()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [assigneeId, setAssigneeId] = useState<number>(UNASSIGNED)
  const [dueDate, setDueDate] = useState(defaultDueDate)
  const [titleError, setTitleError] = useState<string>()

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

  function reset() {
    setTitle('')
    setPriority('medium')
    setAssigneeId(UNASSIGNED)
    setDueDate(defaultDueDate())
    setTitleError(undefined)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) {
      setTitleError('A task needs a title.')
      return
    }

    // The active sprint is the last one in the schedule.
    const sprintId = sprints[sprints.length - 1]?.id ?? 1

    createTask.mutate(
      {
        title: title.trim(),
        description: '',
        priority,
        assigneeId: assigneeId === UNASSIGNED ? null : assigneeId,
        dueDate,
        sprintId,
      },
      { onSuccess: handleClose },
    )
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New task"
      description="It will be added to the top of the Backlog column."
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="new-task-form" loading={createTask.isPending}>
            Create task
          </Button>
        </>
      }
    >
      <form id="new-task-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Title"
          required
          autoFocus
          value={title}
          error={titleError}
          placeholder="e.g. Add sprint burndown widget"
          onChange={(event) => setTitle(event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Priority"
            value={priority}
            options={PRIORITY_OPTIONS}
            onChange={setPriority}
          />
          <Input
            label="Due date"
            type="date"
            required
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>
        <Select
          label="Assignee"
          value={assigneeId}
          options={assigneeOptions}
          onChange={setAssigneeId}
        />
      </form>
    </Modal>
  )
}
