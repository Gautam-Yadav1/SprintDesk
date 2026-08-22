import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/lib/storage'
import type { Notification } from '@/types'
import { isFeedExhausted, nextOffset, type FeedPost } from '../services/notificationsApi'

/** Keeps localStorage bounded while still holding far more than one page. */
const MAX_ITEMS = 100

/**
 * Ids 1–100 belong to JSONPlaceholder posts and 101+ to the seed activity, so
 * locally raised notifications start well clear of both.
 */
const FIRST_EVENT_ID = 1_000

/** One inbox per team member, keyed by their `mock-data.json` id. */
type Inboxes = Record<number, Notification[]>

interface NotificationsState {
  inboxes: Inboxes
  /** `_start` for the next poll, persisted so paging continues across reloads. */
  offset: number
  /** Members whose seed activity has been written, so it happens once each. */
  seededFor: number[]
  /** Next id for a locally raised notification. */
  eventSeq: number
  seed: (memberId: number, items: Notification[]) => void
  /** Adds unseen posts to a member's inbox and returns only the new ones. */
  ingest: (memberId: number, posts: FeedPost[]) => Notification[]
  /** Delivers a locally raised notification to one member's inbox. */
  notify: (memberId: number, input: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void
  markRead: (memberId: number, id: number) => void
  markAllRead: (memberId: number) => void
}

function toNotification(post: FeedPost): Notification {
  return {
    id: post.id,
    title: post.title.replace(/^\w/, (char) => char.toUpperCase()),
    message: post.body,
    type: 'system',
    read: false,
    createdAt: new Date().toISOString(),
  }
}

function newestFirst(items: Notification[]): Notification[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX_ITEMS)
}

/** Every read goes through this, so a member with no inbox yet reads as empty. */
function inboxOf(inboxes: Inboxes, memberId: number): Notification[] {
  return inboxes[memberId] ?? []
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      inboxes: {},
      offset: 0,
      seededFor: [],
      eventSeq: FIRST_EVENT_ID,

      seed: (memberId, items) => {
        const { seededFor, inboxes } = get()
        if (seededFor.includes(memberId)) return
        set({
          inboxes: { ...inboxes, [memberId]: newestFirst([...items, ...inboxOf(inboxes, memberId)]) },
          seededFor: [...seededFor, memberId],
        })
      },

      ingest: (memberId, posts) => {
        const { inboxes, offset } = get()
        const current = inboxOf(inboxes, memberId)
        const known = new Set(current.map((item) => item.id))
        const fresh = posts.filter((post) => !known.has(post.id)).map(toNotification)

        // Nothing new and nowhere left to page: leave the state object alone,
        // so an idle poll does not re-render every notification subscriber.
        if (fresh.length === 0 && isFeedExhausted(offset)) return fresh

        set((state) => ({
          inboxes:
            fresh.length > 0
              ? { ...state.inboxes, [memberId]: newestFirst([...fresh, ...inboxOf(state.inboxes, memberId)]) }
              : state.inboxes,
          offset: nextOffset(state.offset),
        }))

        return fresh
      },

      notify: (memberId, input) =>
        set((state) => ({
          inboxes: {
            ...state.inboxes,
            [memberId]: newestFirst([
              { ...input, id: state.eventSeq, read: false, createdAt: new Date().toISOString() },
              ...inboxOf(state.inboxes, memberId),
            ]),
          },
          eventSeq: state.eventSeq + 1,
        })),

      markRead: (memberId, id) =>
        set((state) => ({
          inboxes: {
            ...state.inboxes,
            [memberId]: inboxOf(state.inboxes, memberId).map((item) =>
              item.id === id ? { ...item, read: true } : item,
            ),
          },
        })),

      markAllRead: (memberId) =>
        set((state) => ({
          inboxes: {
            ...state.inboxes,
            [memberId]: inboxOf(state.inboxes, memberId).map((item) => ({ ...item, read: true })),
          },
        })),
    }),
    {
      name: STORAGE_KEYS.notifications,
      storage: createJSONStorage(() => window.localStorage),
      // v1 kept a single shared `items` list with no idea who it belonged to,
      // so there is nothing to route into the per-member inboxes: start clean.
      version: 2,
      migrate: () => ({ inboxes: {}, offset: 0, seededFor: [], eventSeq: FIRST_EVENT_ID }),
    },
  ),
)

/** Selectors kept next to the store so every consumer reads the same way. */
export const selectInbox =
  (memberId: number | undefined) =>
  (state: NotificationsState): Notification[] =>
    memberId === undefined ? [] : inboxOf(state.inboxes, memberId)

export const selectUnreadCount =
  (memberId: number | undefined) =>
  (state: NotificationsState): number =>
    memberId === undefined
      ? 0
      : inboxOf(state.inboxes, memberId).reduce((count, item) => count + (item.read ? 0 : 1), 0)
