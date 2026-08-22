import { createHttpClient } from '@/lib/http'

const jsonPlaceholder = createHttpClient('https://jsonplaceholder.typicode.com')

export interface FeedPost {
  id: number
  userId: number
  title: string
  body: string
}

/** Posts per poll, as the brief specifies. */
const FEED_PAGE_SIZE = 5

/**
 * How far the window slides between polls. Sliding by one — rather than by a
 * whole page — means four of the five posts in each response are already known
 * and exactly one id is new, so activity arrives at the pace of a real feed
 * instead of five at a time.
 */
const FEED_STEP = 1

/** JSONPlaceholder serves ids 1–100. */
const FEED_TOTAL = 100

/** Last offset whose window still holds an id we have not seen. */
const LAST_OFFSET = FEED_TOTAL - FEED_PAGE_SIZE

/**
 * `/posts?_limit=5` alone returns the same five records forever, so polling it
 * verbatim can never surface a genuinely new id after the first response. The
 * five-post window is kept and slid forward instead, which makes "a new post
 * id is a new notification" true on every tick without inventing a batch.
 */
export function fetchFeed(offset: number): Promise<FeedPost[]> {
  return jsonPlaceholder.get<FeedPost[]>(`/posts?_start=${offset}&_limit=${FEED_PAGE_SIZE}`)
}

/** Stops at the end of the collection: past it every id is already known. */
export function nextOffset(offset: number): number {
  return Math.min(offset + FEED_STEP, LAST_OFFSET)
}

export function isFeedExhausted(offset: number): boolean {
  return offset >= LAST_OFFSET
}
