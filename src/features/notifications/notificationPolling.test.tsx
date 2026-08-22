import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToastStore } from '@/hooks/useToast'
import { useNotificationPolling } from './hooks/useNotificationPolling'
import { useNotificationsStore } from './store/notificationsStore'

const POLL_INTERVAL_MS = 20_000
const FEED_TOTAL = 100
/** `useCurrentMember` falls back to the first seed member when nobody is signed in. */
const MEMBER_ID = 1

/** Stands in for JSONPlaceholder's 100 posts. */
function postsAt(start: number, limit: number) {
  const posts = []
  for (let id = start + 1; id <= Math.min(start + limit, FEED_TOTAL); id++) {
    posts.push({ id, userId: 1, title: `post ${id}`, body: 'body' })
  }
  return posts
}

let requestedOffsets: number[] = []

function Poller({ announce = true }: { announce?: boolean }) {
  useNotificationPolling({ announce })
  return null
}

/** One client per case, mirroring the app's single module-scope QueryClient. */
let client: QueryClient

function renderPoller(ui = <Poller />) {
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  return act(async () => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

beforeEach(() => {
  requestedOffsets = []
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // The member is pre-seeded so the local seed query stays out of these cases.
  useNotificationsStore.setState({ inboxes: {}, offset: 0, seededFor: [MEMBER_ID] })
  useToastStore.setState({ toasts: [] })
  vi.useFakeTimers()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const params = new URL(String(url)).searchParams
      const start = Number(params.get('_start') ?? 0)
      requestedOffsets.push(start)
      return new Response(JSON.stringify(postsAt(start, Number(params.get('_limit') ?? 5))), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }),
  )
})

afterEach(async () => {
  await setVisibility('visible')
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('notification polling', () => {
  it('polls once per interval and surfaces one new notification per tick', async () => {
    renderPoller()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 4 + 1_000)

    expect(requestedOffsets).toEqual([0, 1, 2, 3, 4])
    // The first response is history (five posts); each later tick adds one.
    expect(useNotificationsStore.getState().inboxes[MEMBER_ID] ?? []).toHaveLength(9)
  })

  it('treats the first response as history rather than four toasts', async () => {
    renderPoller()
    await vi.advanceTimersByTimeAsync(1_000)

    expect(useNotificationsStore.getState().inboxes[MEMBER_ID] ?? []).toHaveLength(5)
    expect(useToastStore.getState().toasts).toHaveLength(0)

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(useToastStore.getState().toasts).toHaveLength(1)
  })

  it('stays quiet while the panel is open', async () => {
    renderPoller(<Poller announce={false} />)
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3)

    expect((useNotificationsStore.getState().inboxes[MEMBER_ID] ?? []).length).toBeGreaterThan(5)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('does not fetch a fresh page when the bell remounts inside the interval', async () => {
    const view = renderPoller()
    await vi.advanceTimersByTimeAsync(1_000)
    expect(requestedOffsets).toHaveLength(1)

    // An HMR save or a route change used to poll immediately on every remount,
    // injecting a whole extra page of notifications on the spot.
    for (let i = 0; i < 3; i++) {
      view.unmount()
      renderPoller()
      await vi.advanceTimersByTimeAsync(200)
    }

    expect(requestedOffsets).toHaveLength(1)
    expect(useNotificationsStore.getState().inboxes[MEMBER_ID] ?? []).toHaveLength(5)
  })

  it('pauses while the tab is hidden and resumes when it comes back', async () => {
    renderPoller()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2)
    const beforeHidden = requestedOffsets.length

    await setVisibility('hidden')
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 6)
    expect(requestedOffsets).toHaveLength(beforeHidden)

    await setVisibility('visible')
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2)
    expect(requestedOffsets.length).toBeGreaterThan(beforeHidden)
  })

  it('goes idle once every post id has been seen', async () => {
    renderPoller()
    // 95 ticks walks the five-post window to the end of the collection.
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 120)

    const { inboxes, offset } = useNotificationsStore.getState()
    const items = inboxes[MEMBER_ID] ?? []
    expect(items).toHaveLength(FEED_TOTAL)
    expect(new Set(items.map((item) => item.id)).size).toBe(FEED_TOTAL)
    // Clamped at the last useful window instead of wrapping round forever.
    expect(offset).toBe(FEED_TOTAL - 5)
    expect(Math.max(...requestedOffsets)).toBe(FEED_TOTAL - 5)
  })
})
