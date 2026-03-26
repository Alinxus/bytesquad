'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ArrowUpRight, Menu } from 'lucide-react'
import { useWithdrawals } from '@/hooks/use-withdrawals'
import { useBalances } from '@/hooks/use-balances'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/sidebar'
import { formatCurrency, formatDate, maskAccountNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { WithdrawalStatus } from '@/types'

const statusConfig: Record<WithdrawalStatus, { label: string; className: string; dot: string }> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-warning/10 text-warning border border-warning/20',
    dot: 'bg-warning',
  },
  PROCESSING: {
    label: 'Processing',
    className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    dot: 'bg-blue-400',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-success/10 text-success border border-success/20',
    dot: 'bg-success',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-error/10 text-error border border-error/20',
    dot: 'bg-error',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-surface-2 text-text-muted border border-border',
    dot: 'bg-text-muted',
  },
}

export default function WithdrawalsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: withdrawalsData, isLoading } = useWithdrawals()
  const { data: balances } = useBalances()

  const withdrawals = withdrawalsData?.items || []
  const ngnBalance = balances?.find((b) => b.currency === 'NGN')

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-text-primary">Withdrawals</h1>
          </div>
          <Link href="/withdrawals/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Withdraw
            </Button>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in space-y-6">
          {/* Balance summary */}
          {ngnBalance && (
            <div className="rounded-2xl bg-accent-gradient p-5 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
              <div className="relative">
                <p className="text-white/70 text-sm mb-1">Available for Withdrawal</p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(ngnBalance.availableMinor, 'NGN')}
                </p>
                <p className="text-white/60 text-xs mt-2">
                  Pending: {formatCurrency(ngnBalance.pendingMinor, 'NGN')}
                </p>
              </div>
            </div>
          )}

          {/* Withdrawals table */}
          <div className="rounded-xl bg-surface border border-border overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_2fr_1fr] gap-4 px-5 py-3 bg-surface-2/50 border-b border-border">
              {['Amount', 'Currency', 'Status', 'Payout Account', 'Date'].map((h) => (
                <div key={h} className="text-xs font-medium text-text-muted uppercase tracking-wider">{h}</div>
              ))}
            </div>

            {isLoading ? (
              <div className="divide-y divide-border">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
                  <ArrowUpRight className="w-6 h-6 text-text-muted" />
                </div>
                <p className="text-sm font-medium text-text-primary mb-1">No withdrawals yet</p>
                <p className="text-xs text-text-muted mb-4">Request your first withdrawal to your bank account</p>
                <Link href="/withdrawals/new">
                  <Button size="sm">
                    <Plus className="w-4 h-4" />
                    Request Withdrawal
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {withdrawals.map((withdrawal) => {
                  const config = statusConfig[withdrawal.status as WithdrawalStatus] || statusConfig.PENDING
                  return (
                    <div
                      key={withdrawal.id}
                      className="flex flex-col md:grid md:grid-cols-[1.5fr_1fr_1fr_2fr_1fr] gap-2 md:gap-4 items-start md:items-center px-5 py-4 hover:bg-surface-2/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {formatCurrency(withdrawal.amountMinor, withdrawal.currency)}
                        </p>
                        {withdrawal.feeMinor > 0 && (
                          <p className="text-xs text-text-muted">
                            Fee: {formatCurrency(withdrawal.feeMinor, withdrawal.currency)}
                          </p>
                        )}
                      </div>

                      <p className="text-sm text-text-secondary">{withdrawal.currency}</p>

                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium w-fit',
                          config.className
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
                        {config.label}
                      </span>

                      <div>
                        {withdrawal.payoutAccount ? (
                          <div>
                            <p className="text-sm text-text-primary">{withdrawal.payoutAccount.bankName}</p>
                            <p className="text-xs text-text-muted font-mono">
                              ****{withdrawal.payoutAccount.accountNumberLast4}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-text-muted">—</p>
                        )}
                      </div>

                      <p className="text-sm text-text-secondary">{formatDate(withdrawal.createdAt)}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
