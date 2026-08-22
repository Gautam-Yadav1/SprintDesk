import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useMoveTaskStatus, useCreateTask } from '@/features/board/hooks/useTaskMutations'
import { useNotificationsStore } from './store/notificationsStore'

const EMILY = 1
const MICHAEL = 2
/** Seed task 2, "Build Kanban board", is assigned to Michael Williams. */
const MICHAELS_TASK = 2

function signInAs(firstName: string, lastName: string) {
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 'test-token',
    user: {
      id: 1,
      username: 'test',
      email: 'test@example.com',
      firstName,
      lastName,
      image: '',
    },
  })
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function inboxOf(memberId: number) {
  return useNotificationsStore.getState().inboxes[memberId] ?? []
}

beforeEach(() => {
  useNotificationsStore.setState({
    inboxes: {},
    offset: 0,
    seededFor: [EMILY, MICHAEL],
    eventSeq: 1_000,
  })
})

describe('per-member inboxes', () => {
  it('keeps read state separate for each member', () => {
    const { notify, markAllRead } = useNotificationsStore.getState()
    notify(EMILY, { title: 'For Emily', message: 'x', type: 'task' })
    notify(MICHAEL, { title: 'For Michael', message: 'y', type: 'task' })

    markAllRead(EMILY)

    expect(inboxOf(EMILY).every((item) => item.read)).toBe(true)
    expect(inboxOf(MICHAEL).every((item) => !item.read)).toBe(true)
  })

  it('gives locally raised activity ids that cannot collide with feed posts', () => {
    const { notify } = useNotificationsStore.getState()
    notify(EMILY, { title: 'a', message: 'x', type: 'task' })
    notify(EMILY, { title: 'b', message: 'y', type: 'task' })

    // Post ids run 1–100 and the seed activity 101+.
    expect(inboxOf(EMILY).map((item) => item.id)).toEqual([1_001, 1_000])
  })
})

describe('task activity notifications', () => {
  it("notifies the assignee when someone else moves their task", async () => {
    signInAs('Emily', 'Johnson')
    const { result } = renderHook(() => useMoveTaskStatus(), { wrapper })

    result.current.mutate({ id: MICHAELS_TASK, status: 'review' })
    await waitFor(() => expect(inboxOf(MICHAEL)).toHaveLength(1))

    expect(inboxOf(MICHAEL)[0]).toMatchObject({
      title: 'Review requested',
      type: 'review',
      read: false,
    })
    // Emily did the moving, so nothing lands in her own inbox.
    expect(inboxOf(EMILY)).toHaveLength(0)
  })

  it('does not notify you about your own task', async () => {
    signInAs('Michael', 'Williams')
    const { result } = renderHook(() => useMoveTaskStatus(), { wrapper })

    result.current.mutate({ id: MICHAELS_TASK, status: 'done' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(inboxOf(MICHAEL)).toHaveLength(0)
  })

  it('notifies the assignee when a task is created for them', async () => {
    signInAs('Emily', 'Johnson')
    const { result } = renderHook(() => useCreateTask(), { wrapper })

    result.current.mutate({
      title: 'Ship the release notes',
      description: '',
      priority: 'medium',
      assigneeId: MICHAEL,
      dueDate: '2026-09-30',
      sprintId: 1,
    })
    await waitFor(() => expect(inboxOf(MICHAEL)).toHaveLength(1))

    expect(inboxOf(MICHAEL)[0]).toMatchObject({ title: 'Task assigned', type: 'task' })
    expect(inboxOf(MICHAEL)[0]?.message).toContain('Ship the release notes')
  })
})
