type ClassValue = string | false | null | undefined

/** Joins conditional class names. Local so the design system needs no `clsx` dependency. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
