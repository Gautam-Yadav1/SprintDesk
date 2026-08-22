import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HttpError } from '@/lib/http'
import { queryKeys } from '@/lib/queryKeys'
import type { LoginCredentials } from '../services/authApi'
import { signInWithCredentials } from '../services/authSession'

export interface LoginInput extends LoginCredentials {
  rememberMe: boolean
}

function toMessage(error: unknown): string {
  if (error instanceof HttpError) {
    return error.status === 400 || error.status === 401
      ? 'Invalid username or password.'
      : error.message
  }
  return 'Could not reach the authentication service. Check your connection.'
}

export function useLogin() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ rememberMe, ...credentials }: LoginInput) =>
      signInWithCredentials(credentials, rememberMe),
    onSuccess: () => {
      // A restored-session query from a previous visit must not shadow this one.
      queryClient.removeQueries({ queryKey: queryKeys.session })
    },
  })

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error ? toMessage(mutation.error) : null,
  }
}
