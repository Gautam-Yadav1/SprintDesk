import { useState, type FormEvent } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Input'
import { formatDateTime } from '@/lib/format'
import type { User } from '@/types'
import { useComments } from '../hooks/useBoardQueries'
import { useAddComment } from '../hooks/useTaskMutations'

export interface TaskCommentsProps {
  taskId: number
  userMap: Map<number, User>
  currentMember: User | undefined
}

export function TaskComments({ taskId, userMap, currentMember }: TaskCommentsProps) {
  const { data: comments, isPending, isError, refetch } = useComments(taskId)
  const addComment = useAddComment(taskId)
  const [message, setMessage] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || !currentMember) return

    addComment.mutate(
      { authorId: currentMember.id, message: trimmed },
      { onSuccess: () => setMessage('') },
    )
  }

  return (
    <section aria-labelledby={`comments-${taskId}`} className="space-y-3">
      <h3 id={`comments-${taskId}`} className="text-sm font-semibold text-content">
        Comments {comments && comments.length > 0 && `(${comments.length})`}
      </h3>

      {isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-line bg-surface-sunken p-3 text-sm">
          <p className="text-content-muted">Comments could not be loaded.</p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : comments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm text-content-muted">
          No comments yet. Start the discussion below.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const author = userMap.get(comment.authorId)
            return (
              <li key={comment.id} className="flex gap-2.5">
                <Avatar name={author?.name ?? 'Unknown member'} src={author?.avatar} size="sm" decorative />
                <div className="min-w-0 flex-1 rounded-lg bg-surface-sunken px-3 py-2">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-content-muted">
                    <span className="font-medium text-content">{author?.name ?? 'Unknown member'}</span>
                    <time dateTime={comment.createdAt}>{formatDateTime(comment.createdAt)}</time>
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-content">{comment.message}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          label="Add a comment"
          rows={3}
          value={message}
          placeholder="Share an update with the team…"
          onChange={(event) => setMessage(event.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          loading={addComment.isPending}
          disabled={!message.trim() || !currentMember}
        >
          Post comment
        </Button>
      </form>
    </section>
  )
}
