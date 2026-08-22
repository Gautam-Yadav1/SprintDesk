import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  listComments,
  listSprints,
  listTasks,
  listUsers,
} from '@/services/data/localData'
import type { User } from '@/types'

/** The 30 sprint tasks. Server state — cached, refetched and owned by Query. */
export function useTasks() {
  return useQuery({ queryKey: queryKeys.tasks, queryFn: listTasks })
}

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: listUsers, staleTime: Infinity })
}

export function useSprints() {
  return useQuery({ queryKey: queryKeys.sprints, queryFn: listSprints, staleTime: Infinity })
}

export function useComments(taskId: number | null) {
  return useQuery({
    queryKey: queryKeys.comments(taskId ?? 0),
    queryFn: () => listComments(taskId!),
    enabled: taskId !== null,
  })
}

/** Id-keyed lookup so cards and the table resolve assignees without scanning arrays. */
export function useUserMap(users: User[] | undefined): Map<number, User> {
  return useMemo(() => new Map((users ?? []).map((user) => [user.id, user])), [users])
}
