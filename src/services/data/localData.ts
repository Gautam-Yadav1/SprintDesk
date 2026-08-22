/**
 * Local data service — the ONLY module in the app that touches `mock-data.json`.
 *
 * It behaves like a remote API: every method is async, returns cloned data and
 * pays an artificial network latency. Swapping SprintDesk onto a real backend
 * means reimplementing the exported functions in this file against `http` —
 * no component, hook or store above this layer changes.
 *
 * Writes are kept in a session dataset that is mirrored to localStorage so the
 * simulated backend survives a page refresh the way a real one would.
 */
import seed from './mock-data.json'
import { readJSON, STORAGE_KEYS, writeJSON } from '@/lib/storage'
import type {
  Comment,
  NewTaskInput,
  Notification,
  Sprint,
  Task,
  TaskEditableFields,
  TaskStatus,
  User,
} from '@/types'

interface Dataset {
  users: User[]
  sprints: Sprint[]
  tasks: Task[]
  comments: Comment[]
  notifications: Notification[]
}

/** The board is seeded from the first page of tasks in the mock data. */
const TASK_PAGE_SIZE = 30

const BASE_LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 260
const JITTER_MS = import.meta.env.MODE === 'test' ? 0 : 220

const dataset: Dataset = loadDataset()

function loadDataset(): Dataset {
  const stored = readJSON<Dataset>(STORAGE_KEYS.dataset)
  if (stored) return stored

  // "The first 30 tasks from mock-data.json" bounds the *seed*, not every
  // later read. Slicing on each read instead truncated the session dataset
  // back to 30 rows, so a created task — appended at index 30 — was written
  // to storage and then silently dropped by the very next fetch.
  const initial = structuredClone(seed) as unknown as Dataset
  return { ...initial, tasks: initial.tasks.slice(0, TASK_PAGE_SIZE) }
}

function persist(): void {
  writeJSON(STORAGE_KEYS.dataset, dataset)
}

/** Resolves after a plausible round-trip, with a clone so callers cannot mutate the store. */
function respond<T>(value: T): Promise<T> {
  const wait = BASE_LATENCY_MS + Math.random() * JITTER_MS
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(value)), wait)
  })
}

function nextId(rows: { id: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1
}

export function listUsers(): Promise<User[]> {
  return respond(dataset.users)
}

export function listSprints(): Promise<Sprint[]> {
  return respond(dataset.sprints)
}

export function listTasks(): Promise<Task[]> {
  return respond(dataset.tasks)
}

export function listComments(taskId: number): Promise<Comment[]> {
  const rows = dataset.comments
    .filter((comment) => comment.taskId === taskId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return respond(rows)
}

/** Activity seeded into the notification store on a first visit. */
export function listSeedNotifications(): Promise<Notification[]> {
  return respond(dataset.notifications)
}

export function createTask(input: NewTaskInput): Promise<Task> {
  const now = new Date().toISOString()
  const task: Task = {
    id: nextId(dataset.tasks),
    title: input.title,
    description: input.description,
    status: 'backlog',
    priority: input.priority,
    assigneeId: input.assigneeId,
    dueDate: input.dueDate,
    sprintId: input.sprintId,
    order: dataset.tasks.filter((t) => t.status === 'backlog').length + 1,
    createdAt: now,
    completedAt: null,
    updatedAt: now,
  }
  dataset.tasks = [...dataset.tasks, task]
  persist()
  return respond(task)
}

export function updateTask(
  id: number,
  patch: Partial<TaskEditableFields>,
): Promise<Task> {
  const current = dataset.tasks.find((task) => task.id === id)
  if (!current) return Promise.reject(new Error(`Task ${id} not found`))

  const updated: Task = { ...current, ...patch, updatedAt: new Date().toISOString() }
  dataset.tasks = dataset.tasks.map((task) => (task.id === id ? updated : task))
  persist()
  return respond(updated)
}

/**
 * Write-through for a drag-and-drop move. The board store stays the client-side
 * source of truth for column membership; this keeps the backing record — and the
 * `completedAt` stamp the completion-trend chart reads — consistent with it.
 */
export function updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
  const current = dataset.tasks.find((task) => task.id === id)
  if (!current) return Promise.reject(new Error(`Task ${id} not found`))

  const now = new Date().toISOString()
  const updated: Task = {
    ...current,
    status,
    completedAt: status === 'done' ? (current.completedAt ?? now) : null,
    updatedAt: now,
  }
  dataset.tasks = dataset.tasks.map((task) => (task.id === id ? updated : task))
  persist()
  return respond(updated)
}

export function deleteTask(id: number): Promise<{ id: number }> {
  dataset.tasks = dataset.tasks.filter((task) => task.id !== id)
  dataset.comments = dataset.comments.filter((comment) => comment.taskId !== id)
  persist()
  return respond({ id })
}

export function createComment(input: {
  taskId: number
  authorId: number
  message: string
}): Promise<Comment> {
  const comment: Comment = {
    id: nextId(dataset.comments),
    taskId: input.taskId,
    authorId: input.authorId,
    message: input.message,
    createdAt: new Date().toISOString(),
  }
  dataset.comments = [...dataset.comments, comment]
  persist()
  return respond(comment)
}

