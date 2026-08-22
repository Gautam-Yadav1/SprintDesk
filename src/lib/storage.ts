/**
 * Thin, failure-tolerant wrapper around localStorage.
 *
 * Storage can throw (Safari private mode, blocked cookies, quota); every call
 * site here treats "storage is unavailable" as "no persisted value" rather than
 * letting the app crash.
 */

export const STORAGE_KEYS = {
  /** Simulated backend dataset owned by the local data service. */
  dataset: 'sprintdesk.dataset',
  /** Refresh token only — the access token never leaves memory. */
  session: 'sprintdesk.session',
  /** Zustand-persisted board arrangement. */
  board: 'sprintdesk.board',
  /** Zustand-persisted notification list. */
  notifications: 'sprintdesk.notifications',
  /** Zustand-persisted theme preference. */
  theme: 'sprintdesk.theme',
} as const

export function readJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable or full: persistence is best-effort */
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* nothing to do */
  }
}
