import { cn } from '@/lib/utils'
import type { InvoiceStatus } from '@/types'

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  className?: string
}

const statusConfig: Record<InvoiceStatus, { label: string; className: string; dotColor: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-surface-3 text-text-secondary border border-border',
    dotColor: 'bg-text-muted',
  },
  OPEN: {
    label: 'Open',
    className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    dotColor: 'bg-blue-400',
  },
  PAID: {
    label: 'Paid',
    className: 'bg-success/10 text-success border border-success/20',
    dotColor: 'bg-success',
  },
  VOID: {
    label: 'Void',
    className: 'bg-error/10 text-error border border-error/20',
    dotColor: 'bg-error',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-warning/10 text-warning border border-warning/20',
    dotColor: 'bg-warning',
  },
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DRAFT
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
      {config.label}
    </span>
  )
}
