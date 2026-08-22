import { configureAuthHandlers } from '@/lib/http'
import {
  fetchCurrentUser,
  login,
  refreshTokens,
  type AuthUser,
  type LoginCredentials,
} from './authApi'
import { clearSession, readSession, saveSession } from './sessionStore'
import { useAuthStore } from '../store/authStore'

/**
 * Connects the HTTP client's refresh-and-retry hook to the auth feature.
 * Called once at app start; the client itself never imports the store, which
 * keeps `lib` free of feature dependencies.
 */
export function installAuthInterceptor(): void {
  configureAuthHandlers({
    getAccessToken: () => useAuthStore.getState().accessToken,
    refresh: async () => {
      const session = readSession()
      if (!session) return null

      try {
        const tokens = await refreshTokens(session.refreshToken)
        saveSession(tokens.refreshToken, session.rememberMe)
        useAuthStore.getState().setAccessToken(tokens.accessToken)
        return tokens.accessToken
      } catch {
        clearSession()
        return null
      }
    },
    onRefreshFailure: () => {
      clearSession()
      useAuthStore.getState().signOut()
    },
  })
}

export async function signInWithCredentials(
  credentials: LoginCredentials,
  rememberMe: boolean,
): Promise<AuthUser> {
  const response = await login(credentials)
  const { accessToken, refreshToken, ...user } = response

  saveSession(refreshToken, rememberMe)
  useAuthStore.getState().signIn({ user, accessToken })
  return user
}

/**
 * Restores a session on page load by spending the persisted refresh token.
 * Resolves to `null` when there is nothing valid to restore.
 */
export async function restoreSession(): Promise<AuthUser | null> {
  const session = readSession()
  if (!session) {
    useAuthStore.getState().signOut()
    return null
  }

  try {
    const tokens = await refreshTokens(session.refreshToken)
    saveSession(tokens.refreshToken, session.rememberMe)
    useAuthStore.getState().setAccessToken(tokens.accessToken)

    const user = await fetchCurrentUser()
    useAuthStore.getState().signIn({ user, accessToken: tokens.accessToken })
    return user
  } catch {
    clearSession()
    useAuthStore.getState().signOut()
    return null
  }
}

export function signOut(): void {
  clearSession()
  useAuthStore.getState().signOut()
}
