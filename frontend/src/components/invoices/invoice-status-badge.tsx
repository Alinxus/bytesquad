import { cn } from '@/lib/utils'
import type { InvoiceStatus } from '@/types'

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  className?: string
}

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-surface text-ink-muted border-border',
  },
  OPEN: {
    label: 'Open',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  PAID: {
    label: 'Paid',
    className: 'bg-success/10 text-success border-success/20',
  },
  VOID: {
    label: 'Void',
    className: 'bg-danger/10 text-danger border-danger/20',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DRAFT
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border font-sans leading-none transition-colors',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
