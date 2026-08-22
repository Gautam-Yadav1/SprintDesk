import { useMemo } from 'react'
import { cn } from '@/lib/cn'
import { scorePassword } from '../passwordStrength'

const BAR_COLORS = [
  'bg-red-500',
  'bg-red-500',
  'bg-amber-500',
  'bg-brand-500',
  'bg-emerald-500',
] as const

export function PasswordStrength({ password }: { password: string }) {
  const { score, hint } = useMemo(() => scorePassword(password), [password])

  return (
    <div className="space-y-1">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              index < score ? BAR_COLORS[score] : 'bg-surface-sunken',
            )}
          />
        ))}
      </div>
      <p className="text-xs text-content-muted" aria-live="polite">
        Password strength: {hint}
      </p>
    </div>
  )
}
