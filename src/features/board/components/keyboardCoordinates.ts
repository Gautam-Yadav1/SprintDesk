import {
  closestCorners,
  getFirstCollision,
  KeyboardCode,
  type DroppableContainer,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core'
import { COLUMN_DROPPABLE_PREFIX } from './BoardColumn'

const HORIZONTAL = [KeyboardCode.Left, KeyboardCode.Right] as string[]
const VERTICAL = [KeyboardCode.Up, KeyboardCode.Down] as string[]

function isColumn(container: DroppableContainer): boolean {
  return String(container.id).startsWith(COLUMN_DROPPABLE_PREFIX)
}

/**
 * Keyboard movement for a board with four columns.
 *
 * dnd-kit's `sortableKeyboardCoordinates` only walks the items of the sortable
 * list the drag started in, so left/right would never reach another column.
 * Left/Right therefore target the neighbouring column droppable, while Up/Down
 * fall back to the nearest card above or below inside the current column.
 */
export const boardKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  { context: { active, droppableRects, droppableContainers, collisionRect } },
) => {
  if (!collisionRect || !active) return undefined
  if (!HORIZONTAL.includes(event.code) && !VERTICAL.includes(event.code)) return undefined

  event.preventDefault()

  if (HORIZONTAL.includes(event.code)) {
    const columns = droppableContainers
      .getEnabled()
      .filter(isColumn)
      .map((container) => ({ container, rect: droppableRects.get(container.id) }))
      .filter((entry): entry is { container: DroppableContainer; rect: DOMRect } =>
        Boolean(entry.rect),
      )
      .sort((a, b) => a.rect.left - b.rect.left)

    const currentIndex = columns.findIndex(
      ({ rect }) =>
        collisionRect.left + collisionRect.width / 2 >= rect.left &&
        collisionRect.left + collisionRect.width / 2 <= rect.right,
    )

    const step = event.code === KeyboardCode.Right ? 1 : -1
    const target = columns[currentIndex === -1 ? 0 : currentIndex + step]
    if (!target) return undefined

    return { x: target.rect.left + 12, y: target.rect.top + 12 }
  }

  // Vertical movement stays inside the current column: collide against the
  // other cards and land on the nearest one in the requested direction.
  const candidates = droppableContainers.getEnabled().filter((container) => {
    if (container.id === active.id || isColumn(container)) return false
    const rect = droppableRects.get(container.id)
    if (!rect) return false

    const sameColumn =
      rect.left < collisionRect.right && rect.right > collisionRect.left
    if (!sameColumn) return false

    return event.code === KeyboardCode.Down
      ? rect.top > collisionRect.top
      : rect.top < collisionRect.top
  })

  const collisions = closestCorners({
    active,
    collisionRect,
    droppableRects,
    droppableContainers: candidates,
    pointerCoordinates: null,
  })

  const closestId = getFirstCollision(collisions, 'id')
  if (closestId === null) return undefined

  const rect = droppableRects.get(closestId)
  return rect ? { x: rect.left, y: rect.top } : undefined
}
