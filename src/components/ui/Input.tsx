import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

interface FieldShellProps {
  id: string
  label: string
  required?: boolean
  helperText?: ReactNode
  error?: string
  children: ReactNode
}

const CONTROL_CLASSES =
  'w-full rounded-md border bg-[var(--card)] px-3 py-2 text-sm text-content placeholder:text-content-muted/70 transition-colors disabled:cursor-not-allowed disabled:opacity-60'

function FieldShell({ id, label, required, helperText, error, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="sd-label block text-content-muted">
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-500" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="text-xs text-content-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}

function describedBy(id: string, error?: string, helperText?: ReactNode) {
  if (error) return `${id}-error`
  if (helperText) return `${id}-helper`
  return undefined
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  helperText?: ReactNode
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, error, className, required, ...props },
  ref,
) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} required={required} helperText={helperText} error={error}>
      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, helperText)}
        className={cn(
          CONTROL_CLASSES,
          error ? 'border-red-500' : 'border-line focus:border-brand-500',
          className,
        )}
        {...props}
      />
    </FieldShell>
  )
})

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  helperText?: ReactNode
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, helperText, error, className, required, rows = 4, ...props },
  ref,
) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} required={required} helperText={helperText} error={error}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, helperText)}
        className={cn(
          CONTROL_CLASSES,
          'resize-y',
          error ? 'border-red-500' : 'border-line focus:border-brand-500',
          className,
        )}
        {...props}
      />
    </FieldShell>
  )
})
