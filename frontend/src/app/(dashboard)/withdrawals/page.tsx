'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ArrowUpRight, Menu, ArrowRight, Wallet, Clock, History } from 'lucide-react'
import { useWithdrawals } from '@/hooks/use-withdrawals'
import { useBalances } from '@/hooks/use-balances'
import { NButton } from '@/components/ui/NButton'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/sidebar'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { WithdrawalStatus } from '@/types'

const statusConfig: Record<WithdrawalStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  PROCESSING: {
    label: 'Processing',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-success/10 text-success border-success/20',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-danger/10 text-danger border-danger/20',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-surface text-ink-hint border-border',
  },
}

export default function WithdrawalsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: withdrawalsData, isLoading } = useWithdrawals()
  const { data: balances } = useBalances()

  const withdrawals = withdrawalsData?.items || []
  const ngnBalance = balances?.find((b) => b.currency === 'NGN')

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-ink">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {}
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-8 bg-white/80 backdrop-blur-xl border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-ink-hint hover:text-ink hover:bg-surface transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-display font-bold text-ink tracking-tight">Withdrawals</h1>
          </div>
          <Link href="/withdrawals/new">
            <NButton size="sm" className="h-10 px-5 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              New Withdrawal
            </NButton>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 max-w-7xl mx-auto w-full">
          {}
          {ngnBalance && (
            <div className="rounded-[2.5rem] bg-navy p-10 relative overflow-hidden text-white shadow-2xl shadow-navy/20">
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-primary blur-[120px] rounded-full opacity-20 pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-[0.2em]">Available Liquidity</span>
                  </div>
                  <h2 className="text-display text-5xl md:text-6xl font-bold tracking-tighter mb-2">
                    {formatCurrency(ngnBalance.availableMinor, 'NGN')}
                  </h2>
                  <div className="flex items-center gap-4 text-white/60 text-xs font-bold uppercase tracking-widest mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      Locked: {formatCurrency(ngnBalance.pendingMinor, 'NGN')}
                    </div>
                  </div>
                </div>

                <Link href="/withdrawals/new">
                  <NButton className="bg-white text-navy hover:bg-white/90 h-16 px-10 rounded-2xl group shadow-xl">
                    Push to Bank <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </NButton>
                </Link>
              </div>
            </div>
          )}

          {}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <h3 className="text-[11px] font-bold text-ink-muted uppercase tracking-[0.2em]">Withdrawal Records / History</h3>
              </div>
            </div>

            <div className="nera-card bg-white/50 backdrop-blur-sm overflow-hidden">
              {}
              <div className="hidden lg:grid grid-cols-[2fr_1fr_1.5fr_2fr_1fr_auto] gap-6 px-10 py-5 bg-surface/40 border-b border-border">
                {['Transaction', 'Currency', 'Status', 'Payout Destination', 'Timestamp', ''].map((h) => (
                  <div key={h} className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em]">
                    {h}
                  </div>
                ))}
              </div>

              {isLoading ? (
                <div className="divide-y divide-border">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="px-10 py-6">
                      <Skeleton className="h-12 w-full rounded-2xl" />
                    </div>
                  ))}
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 rounded-[2.5rem] bg-surface flex items-center justify-center mb-6 shadow-sm border border-border">
                    <ArrowUpRight className="w-10 h-10 text-ink-hint opacity-50" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-ink mb-2">Empty History</h3>
                  <p className="text-ink-muted text-sm max-w-[320px] mb-8 leading-relaxed">
                    You haven't initiated any professional payouts yet. Get paid by clients first.
                  </p>
                  <Link href="/withdrawals/new">
                    <NButton size="lg" className="rounded-2xl px-10 h-14">
                      Start payout flow <ArrowRight className="ml-2 w-4 h-4" />
                    </NButton>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {withdrawals.map((withdrawal) => {
                    const config = statusConfig[withdrawal.status as WithdrawalStatus] || statusConfig.PENDING
                    return (
                      <div
                        key={withdrawal.id}
                        className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr_1.5fr_2fr_1fr_auto] gap-4 lg:gap-6 items-start lg:items-center px-8 lg:px-10 py-6 hover:bg-surface transition-all group relative border-l-4 border-l-transparent hover:border-l-primary"
                      >
                        {}
                        <div>
                          <p className="font-display font-bold text-ink group-hover:text-primary transition-colors text-lg tabular-nums">
                            {formatCurrency(withdrawal.amountMinor, withdrawal.currency)}
                          </p>
                          {withdrawal.feeMinor > 0 && (
                            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mt-1">
                              Processing Fee: {formatCurrency(withdrawal.feeMinor, withdrawal.currency)}
                            </p>
                          )}
                        </div>

                        {}
                        <div>
                          <span className="text-xs font-bold text-ink group-hover:text-primary transition-colors">{withdrawal.currency}</span>
                        </div>

                        {}
                        <div>
                          <span className={cn(
                            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border font-sans leading-none transition-colors",
                            config.className
                          )}>
                            {config.label}
                          </span>
                        </div>

                        {}
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider lg:hidden mb-1">Destination</p>
                          {withdrawal.payoutAccount ? (
                            <div>
                              <p className="text-sm font-bold text-ink truncate leading-tight">
                                {withdrawal.payoutAccount.bankName}
                              </p>
                              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mt-1">
                                {withdrawal.payoutAccount.accountName} · ****{withdrawal.payoutAccount.accountNumberLast4}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-ink-hint font-bold italic">— UNDEFINED —</p>
                          )}
                        </div>

                        {}
                        <div>
                          <p className="text-[11px] font-bold text-ink-hint uppercase tracking-wider lg:hidden mb-1">Timestamp</p>
                          <p className="text-xs font-bold text-ink">
                            {formatDate(withdrawal.createdAt)}
                          </p>
                          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mt-0.5 tabular-nums">
                            {new Date(withdrawal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {}
                        <div className="hidden lg:flex items-center justify-end">
                          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-ink-hint group-hover:text-primary transition-colors">
                            <ArrowRight size={14} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {withdrawalsData && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-[10px] font-bold text-ink-hint uppercase tracking-[0.2em]">
                  Total {withdrawals.length} withdrawal records logged
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
