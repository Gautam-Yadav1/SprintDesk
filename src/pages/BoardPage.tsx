import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  useSprints,
  useTasks,
  useUserMap,
  useUsers,
} from '@/features/board/hooks/useBoardQueries'
import { useCurrentMember } from '@/features/board/hooks/useCurrentMember'
import { useMoveTaskStatus } from '@/features/board/hooks/useTaskMutations'
import { BoardFilters } from '@/features/board/components/BoardFilters'
import { NO_FILTERS, type BoardFilterValue } from '@/features/board/filters'
import { KanbanBoard } from '@/features/board/components/KanbanBoard'
import { NewTaskModal } from '@/features/board/components/NewTaskModal'
import { TaskDrawer } from '@/features/board/components/TaskDrawer'
import { findColumnOf, useBoardStore } from '@/features/board/store/boardStore'

function BoardSkeleton() {
  return (
    <div
      className="sd-lanes -mx-3 flex gap-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-x-visible sm:px-0 sm:pb-0 xl:grid-cols-4"
      role="status"
      aria-label="Loading board"
    >
      {Array.from({ length: 4 }, (_, column) => (
        <div
          key={column}
          className="fn-lane w-[85vw] max-w-[21rem] shrink-0 space-y-2 rounded-md p-3 sm:w-auto sm:max-w-none sm:shrink"
        >
          <Skeleton className="h-6 w-28" />
          {Array.from({ length: 3 }, (_, card) => (
            <Skeleton key={card} className="h-24 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function BoardPage() {
  const tasksQuery = useTasks()
  const usersQuery = useUsers()
  const sprintsQuery = useSprints()
  const userMap = useUserMap(usersQuery.data)
  const currentMember = useCurrentMember(usersQuery.data)

  const columns = useBoardStore((state) => state.columns)
  const syncWithTasks = useBoardStore((state) => state.syncWithTasks)
  const lastMove = useBoardStore((state) => state.lastMove)
  const undoLastMove = useBoardStore((state) => state.undoLastMove)
  const moveStatus = useMoveTaskStatus()

  const [openTaskId, setOpenTaskId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [filters, setFilters] = useState<BoardFilterValue>(NO_FILTERS)

  const tasks = tasksQuery.data
  useEffect(() => {
    // Seed (and reconcile) the arrangement whenever the task list changes.
    if (tasks) syncWithTasks(tasks)
  }, [tasks, syncWithTasks])

  const visibleIds = useMemo(() => {
    if (!tasks) return null
    if (filters.priority === 'all' && filters.assignee === 'all') return null

    return new Set(
      tasks
        .filter((task) => filters.priority === 'all' || task.priority === filters.priority)
        .filter((task) => {
          if (filters.assignee === 'all') return true
          if (filters.assignee === 'unassigned') return task.assigneeId === null
          return task.assigneeId === filters.assignee
        })
        .map((task) => task.id),
    )
  }, [tasks, filters])

  const openTask = tasks?.find((task) => task.id === openTaskId) ?? null
  const openTaskColumn = openTask ? findColumnOf(columns, openTask.id) : null

  function handleUndo() {
    const restored = undoLastMove()
    if (restored) moveStatus.mutate({ id: restored.taskId, status: restored.status })
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-4xl font-bold leading-tight text-content sm:text-5xl">
            Sprint board
          </h1>
          <p className="text-sm text-content-muted">
            <span className="sm:hidden">
              Swipe between columns, then hold a card's handle to move it.
            </span>
            <span className="hidden sm:inline">
              Drag a card between columns, or press Enter on its handle to move it with the
              keyboard.
            </span>
          </p>
        </div>
        {/* Both actions are full-width halves on a phone and natural width above it. */}
        <div className="flex shrink-0 items-center gap-2">
          {lastMove && (
            <Button variant="secondary" className="flex-1 sm:flex-none" onClick={handleUndo}>
              Undo move
            </Button>
          )}
          <Button className="flex-1 sm:flex-none" onClick={() => setIsCreating(true)}>
            New task
          </Button>
        </div>
      </header>

      {usersQuery.data && (
        <BoardFilters
          value={filters}
          onChange={setFilters}
          users={usersQuery.data}
          matchCount={visibleIds ? visibleIds.size : (tasks?.length ?? 0)}
          totalCount={tasks?.length ?? 0}
        />
      )}

      {tasksQuery.isPending ? (
        <BoardSkeleton />
      ) : tasksQuery.isError ? (
        <div className="fn-card rounded-md p-8 text-center">
          <p className="text-sm font-medium text-content">The board could not be loaded.</p>
          <p className="mt-1 text-sm text-content-muted">
            The task service did not respond. Nothing has been lost.
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => tasksQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <KanbanBoard
          tasks={tasksQuery.data}
          userMap={userMap}
          visibleIds={visibleIds}
          onOpenTask={setOpenTaskId}
        />
      )}

      {openTask && openTaskColumn && (
        <TaskDrawer
          key={openTask.id}
          task={openTask}
          users={usersQuery.data ?? []}
          userMap={userMap}
          sprints={sprintsQuery.data ?? []}
          currentMember={currentMember}
          columnStatus={openTaskColumn}
          onClose={() => setOpenTaskId(null)}
        />
      )}

      <NewTaskModal
        open={isCreating}
        onClose={() => setIsCreating(false)}
        users={usersQuery.data ?? []}
        sprints={sprintsQuery.data ?? []}
      />
    </div>
  )
}
