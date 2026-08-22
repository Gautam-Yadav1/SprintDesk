import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { formatRelativeTime } from '@/lib/format'
import { selectInbox, selectUnreadCount, useNotificationsStore } from '../store/notificationsStore'

/** The panel shows the latest 20 and pages back through the rest. */
const PAGE_SIZE = 20

export interface NotificationPanelProps {
  labelledBy: string
  /** Whose inbox to show — every member has their own. */
  memberId: number
}

export function NotificationPanel({ labelledBy, memberId }: NotificationPanelProps) {
  const items = useNotificationsStore(selectInbox(memberId))
  const markRead = useNotificationsStore((state) => state.markRead)
  const markAllRead = useNotificationsStore((state) => state.markAllRead)
  const unread = useNotificationsStore(selectUnreadCount(memberId))
  const [page, setPage] = useState(0)

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const visible = items.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  return (
    <div
      role="region"
      aria-labelledby={labelledBy}
      className="flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-line bg-surface-raised shadow-2xl"
    >
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <p className="text-sm font-semibold text-content">
          Notifications
          {unread > 0 && <span className="ml-1 text-content-muted">({unread} unread)</span>}
        </p>
        <Button variant="ghost" size="sm" onClick={() => markAllRead(memberId)} disabled={unread === 0}>
          Mark all read
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-content-muted">
          Nothing yet. New sprint activity will show up here.
        </p>
      ) : (
        <ul className="sd-scrollbar flex-1 divide-y divide-line overflow-y-auto">
          {visible.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => markRead(memberId, item.id)}
                disabled={item.read}
                className={cn(
                  'flex w-full gap-2.5 px-3 py-2.5 text-left transition-colors',
                  item.read ? 'opacity-70' : 'hover:bg-surface-sunken',
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    item.read ? 'bg-transparent' : 'bg-brand-500',
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate text-sm',
                      item.read ? 'text-content-muted' : 'font-medium text-content',
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-content-muted">
                    {item.message}
                  </span>
                  <span className="mt-1 block text-[11px] text-content-muted">
                    <time dateTime={item.createdAt}>{formatRelativeTime(item.createdAt)}</time>
                    {!item.read && <span className="sr-only"> — unread, activate to mark as read</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Newer
          </Button>
          <span className="text-xs text-content-muted">
            Page {current + 1} of {pageCount}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={current >= pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            Older
          </Button>
        </div>
      )}
    </div>
  )
}
