import { useMemo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Skeleton } from './Skeleton'

export interface DataTableColumn<Row> {
  id: string
  header: string
  cell: (row: Row) => ReactNode
  /** Providing this makes the column sortable. */
  sortValue?: (row: Row) => string | number
  className?: string
  /** Hides the column below the `sm` breakpoint. */
  hideOnMobile?: boolean
}

export interface DataTableProps<Row> {
  rows: Row[]
  columns: DataTableColumn<Row>[]
  getRowId: (row: Row) => string | number
  /** Visually hidden table caption; required for screen-reader context. */
  caption: string
  loading?: boolean
  /** Placeholder rows to draw while loading; match the real count to avoid layout shift. */
  skeletonRows?: number
  emptyTitle?: string
  emptyDescription?: string
  initialSort?: { columnId: string; direction: SortDirection }
}

type SortDirection = 'asc' | 'desc'

/**
 * Sortable table with first-class loading and empty states. Sorting is local
 * component state — nothing else in the app needs to observe it.
 */
export function DataTable<Row>({
  rows,
  columns,
  getRowId,
  caption,
  loading,
  skeletonRows = 5,
  emptyTitle = 'Nothing to show',
  emptyDescription,
  initialSort,
}: DataTableProps<Row>) {
  const [sort, setSort] = useState<{ columnId: string; direction: SortDirection } | null>(
    initialSort ?? null,
  )

  const sorted = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((candidate) => candidate.id === sort.columnId)
    if (!column?.sortValue) return rows

    const { sortValue } = column
    return [...rows].sort((a, b) => {
      const left = sortValue(a)
      const right = sortValue(b)
      const comparison =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right))
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }, [rows, columns, sort])

  function toggleSort(columnId: string) {
    setSort((current) =>
      current?.columnId === columnId
        ? { columnId, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { columnId, direction: 'asc' },
    )
  }

  return (
    <div className="sd-scrollbar fn-card overflow-x-auto rounded-md">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b-2 border-line">
            {columns.map((column) => {
              const isSorted = sort?.columnId === column.id
              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={
                    column.sortValue
                      ? isSorted
                        ? sort.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                  className={cn(
                    'sd-label px-4 py-3 text-content-muted',
                    column.hideOnMobile && 'hidden sm:table-cell',
                    column.className,
                  )}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.id)}
                      className="inline-flex items-center gap-1 rounded transition-colors hover:text-content"
                    >
                      {column.header}
                      <svg
                        className={cn('h-3 w-3', isSorted ? 'text-brand-500' : 'text-content-muted/50')}
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d={isSorted && sort.direction === 'desc' ? 'm3 5 3 3 3-3' : 'm3 7 3-3 3 3'}
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }, (_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-line last:border-0">
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn('px-4 py-3', column.hideOnMobile && 'hidden sm:table-cell')}
                  >
                    <Skeleton className="h-4 w-full max-w-[10rem]" />
                  </td>
                ))}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <p className="text-sm font-medium text-content">{emptyTitle}</p>
                {emptyDescription && (
                  <p className="mt-1 text-xs text-content-muted">{emptyDescription}</p>
                )}
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr key={getRowId(row)} className="border-b border-line last:border-0 transition-colors hover:bg-surface-sunken">
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      'px-4 py-3 align-middle',
                      column.hideOnMobile && 'hidden sm:table-cell',
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
