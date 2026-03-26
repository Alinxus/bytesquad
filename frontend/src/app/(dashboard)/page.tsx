'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  ArrowUpRight,
  UserPlus,
  AlertTriangle,
  FileText,
  Menu,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBalances } from '@/hooks/use-balances'
import { useInvoices } from '@/hooks/use-invoices'
import { BalanceCard, BalanceCardSkeleton } from '@/components/dashboard/balance-card'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/sidebar'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, workspace } = useAuth()
  const { data: balances, isLoading: balancesLoading } = useBalances()
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({ limit: 5 })

  const recentInvoices = invoicesData?.items?.slice(0, 5) || []
  const kycStatus: string = 'NOT_STARTED'

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-6 bg-background/90 backdrop-blur-md border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-text-primary leading-tight">Dashboard</h1>
              {workspace?.businessName && (
                <p className="text-xs text-text-muted hidden sm:block leading-tight">
                  {workspace.businessName}
                  {workspace.baseCurrency && ` · ${workspace.baseCurrency}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary hidden md:block">
              Hey, {user?.fullName?.split(' ')[0] || 'there'} 👋
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6 animate-fade-in">
          {/* KYC Warning Banner */}
          {kycStatus !== 'APPROVED' && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/8 border border-warning/20">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-warning">Complete your KYC verification</p>
                <p className="text-xs text-warning/70 mt-0.5">
                  Verify your identity to unlock higher limits and withdrawal features.
                </p>
              </div>
              <Link href="/kyc">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-warning/30 text-warning hover:bg-warning/10 hover:border-warning/50 shrink-0"
                >
                  Verify Now
                </Button>
              </Link>
            </div>
          )}

          {/* Welcome */}
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              Welcome back,{' '}
              <span className="text-transparent bg-clip-text bg-accent-gradient">
                {workspace?.businessName || user?.fullName || 'there'}
              </span>
            </h2>
            <p className="text-text-secondary text-sm mt-1">Here&apos;s your financial overview</p>
          </div>

          {/* Balances */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-text-muted" />
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Balances
                </h3>
              </div>
              <Link href="/withdrawals/new">
                <Button size="sm" variant="ghost" className="text-accent-light hover:text-accent text-xs h-7 px-2.5">
                  Withdraw <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {balancesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(3)].map((_, i) => <BalanceCardSkeleton key={i} />)}
              </div>
            ) : balances && balances.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {balances.map((balance, idx) => (
                  <BalanceCard
                    key={balance.currency}
                    balance={balance}
                    isPrimary={idx === 0 || balance.currency === workspace?.baseCurrency}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-surface border border-border p-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-5 h-5 text-text-muted" />
                </div>
                <p className="text-sm font-medium text-text-primary mb-1">No balances yet</p>
                <p className="text-xs text-text-muted">
                  Create an invoice and collect your first payment to see your balance here.
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-text-muted" />
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Quick Actions
              </h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/invoices/new">
                <Button variant="default" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Invoice
                </Button>
              </Link>
              <Link href="/withdrawals/new">
                <Button variant="secondary" size="sm" className="gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  Withdraw
                </Button>
              </Link>
              <Link href="/customers/new">
                <Button variant="secondary" size="sm" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Customer
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Invoices */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-text-muted" />
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Recent Invoices
                </h3>
              </div>
              <Link href="/invoices">
                <Button size="sm" variant="ghost" className="text-accent-light hover:text-accent text-xs h-7 px-2.5">
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            <div className="rounded-xl bg-surface border border-border overflow-hidden">
              {invoicesLoading ? (
                <div className="divide-y divide-border">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <div>
                          <Skeleton className="w-32 h-3.5 rounded mb-1.5" />
                          <Skeleton className="w-20 h-3 rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-16 h-3.5 rounded hidden sm:block" />
                        <Skeleton className="w-16 h-5 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
                    <FileText className="w-5 h-5 text-text-muted" />
                  </div>
                  <p className="text-sm font-semibold text-text-primary mb-1">No invoices yet</p>
                  <p className="text-xs text-text-muted mb-5 max-w-[220px]">
                    Create your first invoice and start collecting payments
                  </p>
                  <Link href="/invoices/new">
                    <Button size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      New Invoice
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentInvoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between px-5 py-4 hover:bg-surface-2/60 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent-light transition-colors">
                            {invoice.title}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {invoice.invoiceNumber}
                            {invoice.customer?.name ? ` · ${invoice.customer.name}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-semibold text-text-primary tabular-nums">
                            {formatCurrency(invoice.amountMinor, invoice.currency)}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">{formatDate(invoice.createdAt)}</p>
                        </div>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
