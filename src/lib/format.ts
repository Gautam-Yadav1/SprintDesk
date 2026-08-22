import type { TaskPriority } from '@/types'
import type { BadgeTone } from '@/components/ui/Badge'

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

/** "12 Aug" — compact enough for a card at 375px. */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso))
}

/** True when a not-yet-done task's due date is in the past. */
export function isOverdue(dueDate: string, done: boolean): boolean {
  if (done) return false
  const due = new Date(`${dueDate}T23:59:59`)
  return due.getTime() < Date.now()
}

export const PRIORITY_TONE: Record<TaskPriority, BadgeTone> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
}

/** `<input type="date">` needs `YYYY-MM-DD` in local time, not a UTC ISO string. */
export function toDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.35],
  ['month', 12],
]

/** "just now", "5 minutes ago", "2 days ago" — for the notification feed. */
export function formatRelativeTime(iso: string): string {
  let delta = (Date.now() - new Date(iso).getTime()) / 1000
  if (delta < 45) return 'just now'

  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(delta) < size) return relativeFormatter.format(-Math.round(delta), unit)
    delta /= size
  }
  return relativeFormatter.format(-Math.round(delta), 'year')
}
