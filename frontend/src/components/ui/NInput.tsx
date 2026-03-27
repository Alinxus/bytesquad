import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const NInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2 block font-display">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-hint group-focus-within:text-primary transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "w-full h-12 bg-surface border border-border rounded-xl px-4 py-2 transition-all outline-none",
              "focus:border-primary focus:ring-1 focus:ring-primary/20",
              "placeholder:text-ink-hint text-ink font-sans",
              leftIcon && "pl-11",
              rightIcon && "pr-11",
              error && "border-danger focus:border-danger focus:ring-danger/20 animate-shake",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-hint group-focus-within:text-primary transition-colors">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p className={cn(
            "text-xs mt-1 font-sans",
            error ? "text-danger" : "text-ink-hint"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)
NInput.displayName = "NInput"

export { NInput }
