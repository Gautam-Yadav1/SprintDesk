export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface User {
  id: number
  name: string
  email: string
  avatar: string
}

export interface Sprint {
  id: number
  name: string
  startDate: string
  endDate: string
}

export interface Task {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: number | null
  dueDate: string
  sprintId: number
  order: number
  createdAt: string
  completedAt: string | null
  updatedAt: string
}

export interface Comment {
  id: number
  taskId: number
  authorId: number
  message: string
  createdAt: string
}

export interface Notification {
  id: number
  title: string
  message: string
  type: 'task' | 'review' | 'system'
  read: boolean
  createdAt: string
}

/** Fields a user may edit from the task drawer. */
export type TaskEditableFields = Pick<
  Task,
  'title' | 'description' | 'priority' | 'assigneeId' | 'dueDate'
>

/** Payload for the "new task" flow. */
export interface NewTaskInput {
  title: string
  description: string
  priority: TaskPriority
  assigneeId: number | null
  dueDate: string
  sprintId: number
}
