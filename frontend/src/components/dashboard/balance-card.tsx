'use client'

import { TrendingUp } from 'lucide-react'
import { cn, formatCurrency, getCurrencySymbol } from '@/lib/utils'
import type { Balance } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

interface BalanceCardProps {
  balance: Balance
  isPrimary?: boolean
}

export function BalanceCard({ balance, isPrimary }: BalanceCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl p-5 overflow-hidden transition-all duration-300',
        isPrimary
          ? 'bg-accent-gradient text-white shadow-xl shadow-accent/25'
          : 'bg-surface border border-border hover:border-border-light'
      )}
    >
      {}
      {isPrimary && (
        <>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
        </>
      )}

      <div className="relative">
        {}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                isPrimary ? 'bg-white/20 text-white' : 'bg-accent/15 text-accent-light'
              )}
            >
              {getCurrencySymbol(balance.currency)}
            </div>
            <div>
              <p className={cn('text-xs font-medium uppercase tracking-wider', isPrimary ? 'text-white/70' : 'text-text-muted')}>
                {balance.currency}
              </p>
            </div>
          </div>
          <TrendingUp className={cn('w-4 h-4', isPrimary ? 'text-white/60' : 'text-text-muted')} />
        </div>

        {}
        <div className="mb-3">
          <p className={cn('text-xs mb-1', isPrimary ? 'text-white/70' : 'text-text-muted')}>
            Available Balance
          </p>
          <p className={cn('text-2xl font-bold tracking-tight', isPrimary ? 'text-white' : 'text-text-primary')}>
            {formatCurrency(balance.availableMinor, balance.currency)}
          </p>
        </div>

        {}
        <div className={cn('flex gap-4 pt-3', isPrimary ? 'border-t border-white/20' : 'border-t border-border')}>
          <div>
            <p className={cn('text-xs mb-0.5', isPrimary ? 'text-white/60' : 'text-text-muted')}>Pending</p>
            <p className={cn('text-sm font-medium', isPrimary ? 'text-white/80' : 'text-text-secondary')}>
              {formatCurrency(balance.pendingMinor, balance.currency)}
            </p>
          </div>
          <div>
            <p className={cn('text-xs mb-0.5', isPrimary ? 'text-white/60' : 'text-text-muted')}>Reserved</p>
            <p className={cn('text-sm font-medium', isPrimary ? 'text-white/80' : 'text-text-secondary')}>
              {formatCurrency(balance.reservedMinor, balance.currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BalanceCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 bg-surface border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-12 h-3 rounded" />
        </div>
        <Skeleton className="w-4 h-4 rounded" />
      </div>
      <Skeleton className="w-16 h-3 rounded mb-1" />
      <Skeleton className="w-36 h-8 rounded mb-3" />
      <div className="flex gap-4 pt-3 border-t border-border">
        <div>
          <Skeleton className="w-12 h-2.5 rounded mb-1" />
          <Skeleton className="w-20 h-4 rounded" />
        </div>
        <div>
          <Skeleton className="w-12 h-2.5 rounded mb-1" />
          <Skeleton className="w-20 h-4 rounded" />
        </div>
      </div>
    </div>
  )
}
