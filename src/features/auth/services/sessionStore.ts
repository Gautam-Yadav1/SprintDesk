import { readJSON, removeKey, STORAGE_KEYS, writeJSON } from '@/lib/storage'

/**
 * Persistence for the refresh token.
 *
 * The brief requires simulated localStorage persistence here. A production app
 * would keep the refresh token in an httpOnly, SameSite cookie so page scripts
 * cannot read it — see the trade-off note in the README.
 */
interface PersistedSession {
  refreshToken: string
  rememberMe: boolean
  /** Epoch ms after which the stored credential is treated as gone. */
  expiresAt: number
}

/** Bonus: "remember me" keeps the session for 30 days, otherwise 12 hours. */
const REMEMBER_ME_MS = 30 * 24 * 60 * 60 * 1000
const SHORT_SESSION_MS = 12 * 60 * 60 * 1000

export function readSession(): PersistedSession | null {
  const session = readJSON<PersistedSession>(STORAGE_KEYS.session)
  if (!session?.refreshToken) return null
  if (session.expiresAt <= Date.now()) {
    clearSession()
    return null
  }
  return session
}

export function saveSession(refreshToken: string, rememberMe: boolean): void {
  writeJSON(STORAGE_KEYS.session, {
    refreshToken,
    rememberMe,
    expiresAt: Date.now() + (rememberMe ? REMEMBER_ME_MS : SHORT_SESSION_MS),
  } satisfies PersistedSession)
}

export function clearSession(): void {
  removeKey(STORAGE_KEYS.session)
}
