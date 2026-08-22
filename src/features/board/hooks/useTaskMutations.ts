import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { queryKeys } from '@/lib/queryKeys'
import {
  createComment,
  createTask,
  deleteTask,
  updateTask,
  updateTaskStatus,
} from '@/services/data/localData'
import type { Comment, NewTaskInput, Task, TaskEditableFields, TaskStatus } from '@/types'
import { useNotificationsStore } from '@/features/notifications/store/notificationsStore'
import {
  assignedActivity,
  movedActivity,
  type TaskActivity,
} from '@/features/notifications/taskActivity'
import { useBoardStore } from '../store/boardStore'
import { useCurrentMemberId } from './useCurrentMember'

/**
 * Addresses activity to a task's assignee, never to the person who caused it.
 * You already saw your own action land on the board; a notification is for
 * work that moved while somebody else was looking elsewhere.
 */
function useNotifyAssignee() {
  const notify = useNotificationsStore((state) => state.notify)
  const memberId = useCurrentMemberId()

  return (task: Task, activity: TaskActivity) => {
    if (task.assigneeId === null || task.assigneeId === memberId) return
    notify(task.assigneeId, activity)
  }
}

function replaceTask(queryClient: QueryClient, task: Task) {
  queryClient.setQueryData<Task[]>(queryKeys.tasks, (tasks) =>
    (tasks ?? []).map((candidate) => (candidate.id === task.id ? task : candidate)),
  )
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const addToColumn = useBoardStore((state) => state.addTask)
  const notifyAssignee = useNotifyAssignee()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (input: NewTaskInput) => createTask(input),
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(queryKeys.tasks, (tasks) => [...(tasks ?? []), task])
      addToColumn(task.id, task.status)
      notifyAssignee(task, assignedActivity(task))
      toast({ title: 'Task created', description: task.title, variant: 'success' })
    },
    onError: () =>
      toast({ title: 'Could not create task', variant: 'error' }),
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<TaskEditableFields> }) =>
      updateTask(id, patch),
    onSuccess: (task) => {
      replaceTask(queryClient, task)
      toast({ title: 'Task updated', variant: 'success' })
    },
    onError: () => toast({ title: 'Could not save changes', variant: 'error' }),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const removeFromColumn = useBoardStore((state) => state.removeTask)
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: ({ id }) => {
      queryClient.setQueryData<Task[]>(queryKeys.tasks, (tasks) =>
        (tasks ?? []).filter((task) => task.id !== id),
      )
      queryClient.removeQueries({ queryKey: queryKeys.comments(id) })
      removeFromColumn(id)
      toast({ title: 'Task deleted', variant: 'success' })
    },
    onError: () => toast({ title: 'Could not delete task', variant: 'error' }),
  })
}

/**
 * Write-through for a completed drag. The arrangement already changed in the
 * board store; this keeps the persisted record — and the `completedAt` stamp
 * the analytics trend reads — in step with it.
 */
export function useMoveTaskStatus() {
  const queryClient = useQueryClient()
  const notifyAssignee = useNotifyAssignee()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      updateTaskStatus(id, status),
    onSuccess: (task) => {
      replaceTask(queryClient, task)
      notifyAssignee(task, movedActivity(task, task.status))
    },
    onError: () => toast({ title: 'Could not sync the move', variant: 'error' }),
  })
}

export function useAddComment(taskId: number) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (input: { authorId: number; message: string }) =>
      createComment({ taskId, ...input }),
    onSuccess: (comment) => {
      queryClient.setQueryData<Comment[]>(queryKeys.comments(taskId), (comments) => [
        ...(comments ?? []),
        comment,
      ])
    },
    onError: () => toast({ title: 'Could not post comment', variant: 'error' }),
  })
}
