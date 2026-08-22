import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Renders a spinner, blocks clicks and exposes `aria-busy`. */
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const VARIANTS: Record<ButtonVariant, string> = {
  // The inset hairline gives the filled variants a printed edge rather than
  // the flat block of colour a default button uses.
  primary: 'bg-brand-500 text-[#fffdf8] shadow-sm hover:bg-brand-600 active:bg-brand-700',
  secondary:
    'border border-line bg-[var(--card)] text-content shadow-sm hover:border-brand-300 active:translate-y-px',
  ghost: 'text-content-muted hover:bg-content/[0.06] hover:text-content',
  danger: 'bg-brand-700 text-[#fffdf8] shadow-sm hover:bg-brand-800 active:bg-brand-900',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 gap-1.5 rounded-md',
  md: 'h-10 px-4 gap-2 rounded-md text-[11px]',
  lg: 'h-12 px-6 gap-2 rounded-md text-xs',
  icon: 'h-9 w-9 rounded-md',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        // Buttons are typed, not written: mono, uppercase, tracked out.
        'sd-label inline-flex select-none items-center justify-center transition-all',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner className={cn('h-4 w-4', size !== 'icon' && 'mr-1')} />
      ) : (
        leftIcon
      )}
      {size === 'icon' && loading ? null : children}
      {!loading && rightIcon}
    </button>
  )
})
