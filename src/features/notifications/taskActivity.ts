import type { Notification, Task, TaskStatus } from '@/types'

/** A notification before the store stamps it with an id, time and read state. */
export type TaskActivity = Omit<Notification, 'id' | 'read' | 'createdAt'>

/**
 * Wording for activity raised by one team member against another's task.
 * It follows the vocabulary of the seed notifications in `mock-data.json`, so
 * generated activity and seeded activity read as the same system talking.
 */
export function assignedActivity(task: Task): TaskActivity {
  return {
    title: 'Task assigned',
    message: `You have been assigned to '${task.title}'.`,
    type: 'task',
  }
}

export function movedActivity(task: Task, status: TaskStatus): TaskActivity {
  switch (status) {
    case 'review':
      return {
        title: 'Review requested',
        message: `A review has been requested for '${task.title}'.`,
        type: 'review',
      }
    case 'done':
      return {
        title: 'Task completed',
        message: `'${task.title}' has been completed.`,
        type: 'task',
      }
    case 'in-progress':
      return {
        title: 'Task started',
        message: `Work has started on '${task.title}'.`,
        type: 'task',
      }
    case 'backlog':
      return {
        title: 'Task moved back',
        message: `'${task.title}' has been returned to the backlog.`,
        type: 'task',
      }
  }
}
