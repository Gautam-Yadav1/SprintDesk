import { useMemo } from 'react'
import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  duration: number
}

export interface ToastInput {
  title: string
  description?: string
  variant?: ToastVariant
  /** Milliseconds before auto-dismiss; `0` keeps the toast until dismissed. */
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  push: (input: ToastInput) => string
  dismiss: (id: string) => void
  clear: () => void
}

export const DEFAULT_TOAST_DURATION = 4000

/** Timers live outside the store so `dismiss` can cancel a pending auto-dismiss. */
const timers = new Map<string, ReturnType<typeof setTimeout>>()
let sequence = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  push: (input) => {
    sequence += 1
    const id = `toast-${sequence}`
    const toast: Toast = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? 'info',
      duration: input.duration ?? DEFAULT_TOAST_DURATION,
    }

    set((state) => ({ toasts: [...state.toasts, toast] }))

    if (toast.duration > 0) {
      timers.set(
        id,
        setTimeout(() => get().dismiss(id), toast.duration),
      )
    }

    return id
  },

  dismiss: (id) => {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
  },

  clear: () => {
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
    set({ toasts: [] })
  },
}))

/**
 * Feature-facing toast API. Returns stable callbacks so passing `toast` into a
 * mutation callback never re-triggers the effect that owns it.
 */
export function useToast() {
  const push = useToastStore((state) => state.push)
  const dismiss = useToastStore((state) => state.dismiss)
  return useMemo(() => ({ toast: push, dismiss }), [push, dismiss])
}
