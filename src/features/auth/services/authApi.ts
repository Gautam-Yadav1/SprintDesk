import { createHttpClient } from '@/lib/http'

const dummyJson = createHttpClient('https://dummyjson.com')

export interface AuthUser {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  image: string
}

export interface LoginCredentials {
  username: string
  password: string
}

interface TokenPair {
  accessToken: string
  refreshToken: string
}

type LoginResponse = AuthUser & TokenPair

/**
 * Short-lived access tokens in development so the silent-refresh path is
 * exercised within a minute of signing in instead of once an hour.
 */
const ACCESS_TOKEN_TTL_MINUTES = import.meta.env.DEV ? 1 : 60

export function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return dummyJson.post<LoginResponse>('/auth/login', {
    ...credentials,
    expiresInMins: ACCESS_TOKEN_TTL_MINUTES,
  })
}

export function refreshTokens(refreshToken: string): Promise<TokenPair> {
  return dummyJson.post<TokenPair>('/auth/refresh', {
    refreshToken,
    expiresInMins: ACCESS_TOKEN_TTL_MINUTES,
  })
}

/** Authenticated probe used to rehydrate the session on boot. */
export function fetchCurrentUser(): Promise<AuthUser> {
  return dummyJson.get<AuthUser>('/auth/me', { auth: true })
}
