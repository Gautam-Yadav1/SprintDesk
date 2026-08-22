import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_TOAST_DURATION, useToast, useToastStore } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToastStore.getState().clear()
  })

  afterEach(() => {
    useToastStore.getState().clear()
    vi.useRealTimers()
  })

  it('queues a toast with the info variant by default', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: 'Saved' })
    })

    const toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0]).toMatchObject({
      title: 'Saved',
      variant: 'info',
      duration: DEFAULT_TOAST_DURATION,
    })
  })

  it('keeps several toasts in arrival order', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: 'First' })
      result.current.toast({ title: 'Second', variant: 'error' })
    })

    expect(useToastStore.getState().toasts.map((toast) => toast.title)).toEqual([
      'First',
      'Second',
    ])
  })

  it('auto-dismisses once the duration elapses', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: 'Temporary', duration: 1000 })
    })
    expect(useToastStore.getState().toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(999)
    })
    expect(useToastStore.getState().toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('never auto-dismisses a toast with duration 0', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: 'Sticky', duration: 0 })
    })

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(useToastStore.getState().toasts).toHaveLength(1)
  })

  it('dismisses on demand and cancels the pending timer', () => {
    const { result } = renderHook(() => useToast())
    let id = ''

    act(() => {
      id = result.current.toast({ title: 'Manual', duration: 1000 })
      result.current.toast({ title: 'Other', duration: 1000 })
    })

    act(() => {
      result.current.dismiss(id)
    })

    expect(useToastStore.getState().toasts.map((toast) => toast.title)).toEqual(['Other'])

    // The cancelled timer must not fire and remove anything later on.
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('returns stable callbacks across re-renders', () => {
    const { result, rerender } = renderHook(() => useToast())
    const first = result.current

    rerender()
    expect(result.current).toBe(first)
  })
})
