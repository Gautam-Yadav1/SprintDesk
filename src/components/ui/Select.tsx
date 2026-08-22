import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'

export interface SelectOption<T extends string | number> {
  value: T
  label: string
  /** Optional leading visual, e.g. an assignee avatar. */
  adornment?: ReactNode
}

export interface SelectProps<T extends string | number> {
  label: string
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  /** Hides the visible label but keeps it for assistive tech. */
  hideLabel?: boolean
  disabled?: boolean
  helperText?: string
  className?: string
}

/**
 * Hand-built listbox. Follows the ARIA combobox pattern: roving
 * `aria-activedescendant`, full keyboard control, closes on Escape or an
 * outside press and restores focus to the trigger.
 */
export function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
  hideLabel,
  disabled,
  helperText,
  className,
}: SelectProps<T>) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const close = useCallback((focusTrigger = false) => {
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }, [])

  useOnClickOutside([triggerRef, listRef], () => close(), open)

  /** Opening always starts from the current selection. */
  function openList() {
    setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)))
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const selected = options.find((option) => option.value === value)

  function commit(index: number) {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    close(true)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault()
        if (!open) {
          openList()
          return
        }
        const delta = event.key === 'ArrowDown' ? 1 : -1
        setActiveIndex((index) => (index + delta + options.length) % options.length)
        return
      }
      case 'Home':
        if (open) {
          event.preventDefault()
          setActiveIndex(0)
        }
        return
      case 'End':
        if (open) {
          event.preventDefault()
          setActiveIndex(options.length - 1)
        }
        return
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (open) commit(activeIndex)
        else openList()
        return
      case 'Escape':
        if (open) {
          event.preventDefault()
          close(true)
        }
        return
      case 'Tab':
        if (open) close()
        return
      default:
    }
  }

  return (
    /*
      The gaps live on the label and helper rather than on a `space-y` wrapper:
      a visually hidden label is still the wrapper's first child, so `space-y`
      left a 6px margin above the trigger and pushed every hidden-label select
      out of line with the buttons beside it.
    */
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          'block text-sm font-medium text-content',
          hideLabel ? 'sr-only' : 'mb-1.5',
        )}
      >
        {label}
      </label>
      <div className="relative">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
          aria-describedby={helperText ? `${id}-helper` : undefined}
          disabled={disabled}
          onClick={() => (open ? close() : openList())}
          onKeyDown={onKeyDown}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface-raised px-3 text-sm text-content transition-colors',
            'hover:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            {selected?.adornment}
            <span className="truncate">{selected?.label ?? 'Select…'}</span>
          </span>
          <svg
            className={cn('h-4 w-4 shrink-0 text-content-muted transition-transform', open && 'rotate-180')}
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        {open && (
          <ul
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            className="sd-scrollbar absolute z-40 mt-1 max-h-60 w-full animate-fade-in overflow-auto rounded-lg border border-line bg-surface-raised p-1 shadow-lg"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value
              return (
                <li
                  key={option.value}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  data-active={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(index)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-content',
                    index === activeIndex && 'bg-brand-50 dark:bg-brand-900/40',
                    isSelected && 'font-medium',
                  )}
                >
                  {option.adornment}
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <svg className="ml-auto h-4 w-4 text-brand-600 dark:text-brand-300" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="m5 10 3.5 3.5L15 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {helperText && (
        <p id={`${id}-helper`} className="mt-1.5 text-xs text-content-muted">
          {helperText}
        </p>
      )}
    </div>
  )
}
