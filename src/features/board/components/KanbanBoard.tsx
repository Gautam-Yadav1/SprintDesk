import { useCallback, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { cn } from '@/lib/cn'
import type { Task, TaskStatus, User } from '@/types'
import { BOARD_COLUMNS, findColumnOf, useBoardStore } from '../store/boardStore'
import { useMoveTaskStatus } from '../hooks/useTaskMutations'
import { BoardColumn, COLUMN_DROPPABLE_PREFIX } from './BoardColumn'
import { boardKeyboardCoordinates } from './keyboardCoordinates'
import { TaskCardContent } from './TaskCard'

export interface KanbanBoardProps {
  tasks: Task[]
  userMap: Map<number, User>
  /** Ids passing the board filters; `null` means "no filter applied". */
  visibleIds: Set<number> | null
  onOpenTask: (taskId: number) => void
}

function containerOf(id: UniqueIdentifier): TaskStatus | null {
  if (typeof id === 'string' && id.startsWith(COLUMN_DROPPABLE_PREFIX)) {
    return id.slice(COLUMN_DROPPABLE_PREFIX.length) as TaskStatus
  }
  return findColumnOf(useBoardStore.getState().columns, Number(id))
}

function labelOf(status: TaskStatus): string {
  return BOARD_COLUMNS.find((column) => column.status === status)?.label ?? status
}

export function KanbanBoard({ tasks, userMap, visibleIds, onOpenTask }: KanbanBoardProps) {
  const columns = useBoardStore((state) => state.columns)
  const moveTask = useBoardStore((state) => state.moveTask)
  const moveStatus = useMoveTaskStatus()

  const [activeId, setActiveId] = useState<number | null>(null)
  /** Column the drag started in, and the arrangement to restore if it is cancelled. */
  const dragOrigin = useRef<TaskStatus | null>(null)
  const snapshot = useRef<ReturnType<typeof useBoardStore.getState> | null>(null)

  /**
   * Mouse and touch are deliberately separate sensors. A single PointerSensor
   * also receives touch, and its distance constraint would win the race
   * against the TouchSensor's press delay — so on a phone the smallest swipe
   * started a drag instead of scrolling the board.
   */
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: boardKeyboardCoordinates }),
  )

  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks])

  const columnTasks = useMemo(() => {
    return BOARD_COLUMNS.map(({ status, label }) => {
      const all = columns[status]
        .map((id) => taskMap.get(id))
        .filter((task): task is Task => Boolean(task))
      return {
        status,
        label,
        totalCount: all.length,
        tasks: visibleIds ? all.filter((task) => visibleIds.has(task.id)) : all,
      }
    })
  }, [columns, taskMap, visibleIds])

  const activeTask = activeId === null ? null : (taskMap.get(activeId) ?? null)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = Number(event.active.id)
    setActiveId(id)
    dragOrigin.current = containerOf(event.active.id)
    snapshot.current = useBoardStore.getState()
  }, [])

  /** Moves the card across columns while the pointer is still down. */
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const from = containerOf(active.id)
      const to = containerOf(over.id)
      if (!from || !to || from === to) return

      const target = useBoardStore.getState().columns[to]
      const overIndex = typeof over.id === 'number' ? target.indexOf(over.id) : -1
      moveTask(Number(active.id), to, overIndex === -1 ? target.length : overIndex)
    },
    [moveTask],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      const origin = dragOrigin.current
      setActiveId(null)
      dragOrigin.current = null
      snapshot.current = null
      if (!over) return

      const to = containerOf(over.id)
      if (!to) return

      const target = useBoardStore.getState().columns[to]
      const overIndex = typeof over.id === 'number' ? target.indexOf(over.id) : -1
      const taskId = Number(active.id)
      moveTask(taskId, to, overIndex === -1 ? target.length : overIndex)

      // Only a column change needs to reach the service layer.
      if (origin && origin !== to) moveStatus.mutate({ id: taskId, status: to })
    },
    [moveTask, moveStatus],
  )

  const handleDragCancel = useCallback(() => {
    // Restore the arrangement captured before `onDragOver` started editing it.
    const previous = snapshot.current
    if (previous) {
      useBoardStore.setState({ columns: previous.columns, lastMove: previous.lastMove })
    }
    setActiveId(null)
    dragOrigin.current = null
    snapshot.current = null
  }, [])

  const announcements = useMemo<Announcements>(
    () => ({
      onDragStart: ({ active }) =>
        `Picked up task ${taskMap.get(Number(active.id))?.title ?? active.id}.`,
      onDragOver: ({ over }) => {
        const status = over ? containerOf(over.id) : null
        return status ? `Moved over the ${labelOf(status)} column.` : 'No drop target.'
      },
      onDragEnd: ({ active, over }) => {
        const status = over ? containerOf(over.id) : null
        const title = taskMap.get(Number(active.id))?.title ?? active.id
        return status
          ? `Dropped ${title} in the ${labelOf(status)} column.`
          : `Dropped ${title}. It stayed where it was.`
      },
      onDragCancel: ({ active }) =>
        `Cancelled. ${taskMap.get(Number(active.id))?.title ?? active.id} returned to its original position.`,
    }),
    [taskMap],
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      // Columns grow and shrink as cards move between them, so the droppable
      // rects have to be re-measured during the drag, not just at pick-up.
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      // A narrow viewport needs to start scrolling sooner: on the phone strip
      // the next column is only a thumb's width away from the screen edge.
      autoScroll={{ threshold: { x: 0.2, y: 0.2 }, acceleration: 14 }}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/*
        Below `sm` the four columns become a swipeable strip rather than four
        stacked blocks: a card only has to travel one screen width to reach
        the next column, and dnd-kit auto-scrolls the strip on the way.
        Scroll snapping is dropped mid-drag so it cannot fight that scrolling.
      */}
      <div
        className={cn(
          'sd-lanes -mx-3 flex gap-3 overflow-x-auto px-3 pb-2 scroll-pl-3',
          'sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-x-visible sm:px-0 sm:pb-0',
          'xl:grid-cols-4',
          activeId === null && 'snap-x snap-mandatory sm:snap-none',
        )}
      >
        {columnTasks.map((column) => (
          <BoardColumn
            key={column.status}
            status={column.status}
            label={column.label}
            tasks={column.tasks}
            totalCount={column.totalCount}
            userMap={userMap}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {activeTask && (
          // Full width of the overlay wrapper, which dnd-kit sizes from the
          // card being dragged — so the card under the finger is the card.
          <div className="w-full cursor-grabbing rounded-xl border border-brand-400 bg-surface-raised p-3 shadow-2xl ring-1 ring-brand-500/20">
            <TaskCardContent
              task={activeTask}
              assignee={activeTask.assigneeId ? userMap.get(activeTask.assigneeId) : undefined}
              onOpen={onOpenTask}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
