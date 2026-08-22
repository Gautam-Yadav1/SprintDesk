import { create } from 'zustand'
import type { AuthUser } from '../services/authApi'

/** `bootstrapping` covers the initial silent-refresh attempt on app boot. */
export type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  /**
   * In-memory only — deliberately not part of any persisted slice, so the
   * access token never reaches localStorage or sessionStorage.
   */
  accessToken: string | null
  signIn: (payload: { user: AuthUser; accessToken: string }) => void
  setAccessToken: (accessToken: string) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'bootstrapping',
  user: null,
  accessToken: null,

  signIn: ({ user, accessToken }) => set({ status: 'authenticated', user, accessToken }),

  setAccessToken: (accessToken) => set({ accessToken }),

  signOut: () => set({ status: 'unauthenticated', user: null, accessToken: null }),
}))
