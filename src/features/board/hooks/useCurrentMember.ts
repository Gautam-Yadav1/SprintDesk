import { useMemo } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'
import type { User } from '@/types'
import { useUsers } from './useBoardQueries'

/**
 * Maps the signed-in DummyJSON account onto a member of the seed workspace, so
 * comments are attributed to a real person on the board. The demo account
 * (emilys → Emily Johnson) matches by name; anything else falls back to the
 * first team member.
 */
export function useCurrentMember(users: User[] | undefined): User | undefined {
  const authUser = useAuthStore((state) => state.user)

  return useMemo(() => {
    if (!users?.length) return undefined
    if (!authUser) return users[0]
    const fullName = `${authUser.firstName} ${authUser.lastName}`.toLowerCase()
    return users.find((user) => user.name.toLowerCase() === fullName) ?? users[0]
  }, [users, authUser])
}

/**
 * The same identity, for callers that do not already hold the user list — the
 * notification bell and the task mutations, which need to know who "you" are
 * to address activity to somebody else.
 */
export function useCurrentMemberId(): number | undefined {
  const usersQuery = useUsers()
  return useCurrentMember(usersQuery.data)?.id
}
