import { useMemo } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Select, type SelectOption } from '@/components/ui/Select'
import type { TaskPriority, User } from '@/types'
import { NO_FILTERS, type BoardFilterValue } from '../filters'

const PRIORITY_OPTIONS: SelectOption<TaskPriority | 'all'>[] = [
  { value: 'all', label: 'All priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export interface BoardFiltersProps {
  value: BoardFilterValue
  onChange: (value: BoardFilterValue) => void
  users: User[]
  /** Tasks passing the filters, and the board total, for the summary line. */
  matchCount: number
  totalCount: number
}

/** Bonus feature: narrow the board by priority and assignee. */
export function BoardFilters({
  value,
  onChange,
  users,
  matchCount,
  totalCount,
}: BoardFiltersProps) {
  const assigneeOptions = useMemo<SelectOption<number | 'all' | 'unassigned'>[]>(
    () => [
      { value: 'all', label: 'All assignees' },
      { value: 'unassigned', label: 'Unassigned' },
      ...users.map((user) => ({
        value: user.id,
        label: user.name,
        adornment: <Avatar name={user.name} src={user.avatar} size="xs" decorative />,
      })),
    ],
    [users],
  )

  const isFiltered = value.priority !== 'all' || value.assignee !== 'all'

  return (
    <section
      aria-label="Board filters"
      className="rounded-xl border border-line bg-surface-raised p-3"
    >
      {/*
        Every control in this bar is 40px tall and stretches to the row, so the
        selects and the button share one baseline instead of each sitting at
        its own height. Below `sm` the two selects split the width evenly.
      */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select
            label="Filter by priority"
            hideLabel
            className="w-full sm:w-44"
            value={value.priority}
            options={PRIORITY_OPTIONS}
            onChange={(priority) => onChange({ ...value, priority })}
          />
          <Select
            label="Filter by assignee"
            hideLabel
            className="w-full sm:w-52"
            value={value.assignee}
            options={assigneeOptions}
            onChange={(assignee) => onChange({ ...value, assignee })}
          />
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p aria-live="polite" className="text-xs text-content-muted">
            {isFiltered ? (
              <>
                <span className="font-medium text-content tabular-nums">{matchCount}</span> of{' '}
                <span className="tabular-nums">{totalCount}</span> tasks
              </>
            ) : (
              <>
                <span className="font-medium text-content tabular-nums">{totalCount}</span> tasks
              </>
            )}
          </p>
          <Button
            variant="secondary"
            onClick={() => onChange(NO_FILTERS)}
            disabled={!isFiltered}
            className="shrink-0"
          >
            Clear filters
          </Button>
        </div>
      </div>
    </section>
  )
}
