import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatDate, isOverdue, PRIORITY_TONE } from '@/lib/format'
import type { Task, TaskPriority, TaskStatus } from '@/types'
import { useBoardAnalytics } from '@/features/analytics/hooks/useBoardAnalytics'
import { useTasks, useUserMap, useUsers } from '@/features/board/hooks/useBoardQueries'
import { BOARD_COLUMNS, findColumnOf, useBoardStore } from '@/features/board/store/boardStore'
import { useAuthStore } from '@/features/auth/store/authStore'

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }

/**
 * The dashboard shows a fixed-height slice of the board rather than all 30
 * tasks: it keeps the page a summary, and it lets the loading skeleton reserve
 * exactly the space the loaded table needs, so nothing shifts on arrival.
 */
const VISIBLE_ROWS = 12

function StatCard({
  label,
  value,
  tone,
  loading,
}: {
  label: string
  value: number
  tone?: 'default' | 'danger'
  loading: boolean
}) {
  return (
    // A tag torn from the notebook, not a stat panel: the figure written by
    // hand, the label typed underneath.
    <div className="fn-card rounded-md px-3 py-2.5">
      {loading ? (
        <Skeleton className="h-8 w-10" />
      ) : (
        <p
          className={cn(
            'font-display text-[2rem] font-bold leading-none tabular-nums',
            tone === 'danger' && value > 0 ? 'text-brand-500' : 'text-content',
          )}
        >
          {value}
        </p>
      )}
      <p className="sd-label mt-1.5 text-content-muted">{label}</p>
    </div>
  )
}

function columnLabel(status: TaskStatus): string {
  return BOARD_COLUMNS.find((column) => column.status === status)?.label ?? status
}

export default function DashboardPage() {
  const tasksQuery = useTasks()
  const usersQuery = useUsers()
  const userMap = useUserMap(usersQuery.data)
  const columns = useBoardStore((state) => state.columns)
  const firstName = useAuthStore((state) => state.user?.firstName)
  const { summary } = useBoardAnalytics(tasksQuery.data, undefined, columns)

  // Open work first, then by due date: a completed task from three weeks ago is
  // not what "due soonest" should be telling anyone about.
  const soonestTasks = useMemo(() => {
    const isDone = (task: Task) => (findColumnOf(columns, task.id) ?? task.status) === 'done'
    return [...(tasksQuery.data ?? [])]
      .sort((a, b) => {
        const byState = Number(isDone(a)) - Number(isDone(b))
        return byState !== 0 ? byState : a.dueDate.localeCompare(b.dueDate)
      })
      .slice(0, VISIBLE_ROWS)
  }, [tasksQuery.data, columns])

  const tableColumns = useMemo<DataTableColumn<Task>[]>(
    () => [
      {
        id: 'title',
        header: 'Task',
        sortValue: (task) => task.title,
        cell: (task) => (
          <Link
            to="/board"
            className="rounded font-semibold text-content hover:text-brand-500"
          >
            {task.title}
          </Link>
        ),
      },
      {
        id: 'status',
        header: 'Column',
        sortValue: (task) => columnLabel(findColumnOf(columns, task.id) ?? task.status),
        cell: (task) => {
          const status = findColumnOf(columns, task.id) ?? task.status
          return <Badge tone={status === 'done' ? 'success' : 'brand'}>{columnLabel(status)}</Badge>
        },
      },
      {
        id: 'priority',
        header: 'Priority',
        sortValue: (task) => PRIORITY_RANK[task.priority],
        cell: (task) => <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>,
      },
      {
        id: 'assignee',
        header: 'Assignee',
        hideOnMobile: true,
        sortValue: (task) =>
          task.assigneeId === null ? 'zz' : (userMap.get(task.assigneeId)?.name ?? 'zz'),
        cell: (task) => {
          const assignee = task.assigneeId === null ? undefined : userMap.get(task.assigneeId)
          return (
            <span className="flex items-center gap-2 whitespace-nowrap">
              <Avatar name={assignee?.name ?? 'Unassigned'} src={assignee?.avatar} size="xs" decorative />
              <span className="text-content-muted">{assignee?.name ?? 'Unassigned'}</span>
            </span>
          )
        },
      },
      {
        id: 'dueDate',
        header: 'Due',
        hideOnMobile: true,
        sortValue: (task) => task.dueDate,
        cell: (task) => {
          const overdue = isOverdue(
            task.dueDate,
            (findColumnOf(columns, task.id) ?? task.status) === 'done',
          )
          return (
            <span
              className={cn(
                'whitespace-nowrap',
                overdue ? 'font-bold text-brand-500' : 'text-content-muted',
              )}
            >
              {formatDate(task.dueDate)}
              {overdue && <span className="sr-only"> (overdue)</span>}
            </span>
          )
        },
      },
    ],
    [columns, userMap],
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-bold leading-tight text-content sm:text-5xl">
          {firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          A snapshot of the current sprint. Open the{' '}
          <Link to="/board" className="rounded font-semibold text-brand-500 underline decoration-dotted underline-offset-2">
            board
          </Link>{' '}
          to move work along.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-[18px] lg:grid-cols-4">
        <StatCard label="Total tasks" value={summary.total} loading={tasksQuery.isPending} />
        <StatCard label="In progress" value={summary.inProgress} loading={tasksQuery.isPending} />
        <StatCard label="Completed" value={summary.done} loading={tasksQuery.isPending} />
        <StatCard
          label="Overdue"
          value={summary.overdue}
          tone="danger"
          loading={tasksQuery.isPending}
        />
      </div>

      <section className="space-y-3" aria-labelledby="tasks-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="tasks-heading" className="font-display text-2xl font-bold text-content">
            Due soonest
          </h2>
          <Link
            to="/board"
            className="sd-label rounded text-brand-500 underline decoration-dotted underline-offset-4"
          >
            All {summary.total} tasks on the board
          </Link>
        </div>
        <DataTable
          caption="Twelve sprint tasks, open work first and then by nearest due date, sortable by column, priority, assignee and due date."
          rows={soonestTasks}
          columns={tableColumns}
          getRowId={(task) => task.id}
          loading={tasksQuery.isPending}
          skeletonRows={VISIBLE_ROWS}
          initialSort={{ columnId: 'dueDate', direction: 'asc' }}
          emptyTitle={tasksQuery.isError ? 'Tasks could not be loaded' : 'No tasks yet'}
          emptyDescription={
            tasksQuery.isError
              ? 'The task service did not respond. Try again in a moment.'
              : 'Create your first task from the board.'
          }
        />
      </section>
    </div>
  )
}
