/** Single registry of query keys so invalidation never guesses at a string. */
export const queryKeys = {
  session: ['auth', 'session'] as const,
  users: ['users'] as const,
  sprints: ['sprints'] as const,
  tasks: ['tasks'] as const,
  comments: (taskId: number) => ['comments', taskId] as const,
  notificationFeed: ['notifications', 'feed'] as const,
  notificationSeed: ['notifications', 'seed'] as const,
}
