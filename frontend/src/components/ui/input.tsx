import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, prefix, suffix, ...props }, ref) => {
  const baseClasses = cn(
    'flex h-10 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-text-muted',
    'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-0',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-colors duration-200',
    prefix && 'pl-8',
    suffix && 'pr-8',
    className
  )

  if (prefix || suffix) {
    return (
      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3 flex items-center text-text-muted text-sm pointer-events-none">{prefix}</div>
        )}
        <input
          type={type}
          className={baseClasses}
          ref={ref}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 flex items-center text-text-muted text-sm pointer-events-none">{suffix}</div>
        )}
      </div>
    )
  }

  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-text-muted',
        'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-0',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors duration-200',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
