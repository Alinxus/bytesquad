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
  Clock,
  ArrowRight
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBalances } from '@/hooks/use-balances'
import { useInvoices } from '@/hooks/use-invoices'
import { NHeroCard } from '@/components/ui/NHeroCard'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { NButton } from '@/components/ui/NButton'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/sidebar'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, workspace } = useAuth()
  const { data: balances, isLoading: balancesLoading } = useBalances()
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({ limit: 5 })

  const recentInvoices = invoicesData?.items?.slice(0, 5) || []
  const kycStatus: string = 'NOT_STARTED'
  const primaryBalance = balances?.find(b => b.currency === workspace?.baseCurrency) || balances?.[0]

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-8 bg-white/80 backdrop-blur-xl border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-ink-hint hover:text-ink hover:bg-surface transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-display font-bold text-ink tracking-tight">Dashboard</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                <p className="text-[10px] font-bold text-ink-hint uppercase tracking-widest">
                  Live System · {workspace?.baseCurrency || 'USD'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <p className="text-sm font-bold text-ink hidden md:block">
              {user?.fullName?.split(' ')[0] || 'Member'}
            </p>
            <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.fullName?.[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 max-w-7xl mx-auto w-full">
          {kycStatus !== 'APPROVED' && (
            <div className="flex flex-col sm:flex-row items-center gap-4 p-6 rounded-3xl bg-warning-bg border border-warning/20 shadow-sm animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="font-display font-bold text-ink leading-tight">Verification Required</h4>
                <p className="text-sm text-ink-muted mt-0.5">Verify your identity to unlock global payouts and higher limits.</p>
              </div>
              <Link href="/kyc" className="w-full sm:w-auto">
                <NButton 
                  variant="navy" 
                  size="sm" 
                  className="w-full sm:w-auto h-10 px-6 rounded-xl"
                >
                  Verify Now
                </NButton>
              </Link>
            </div>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-display text-3xl">Command Center.</h2>
                  <p className="text-ink-muted text-sm mt-1">Manage your professional payments globally.</p>
                </div>
              </div>

              {balancesLoading ? (
                <div className="w-full h-[220px] rounded-[2rem] bg-surface animate-pulse" />
              ) : primaryBalance ? (
                <NHeroCard 
                  balance={formatCurrency(primaryBalance.availableMinor, primaryBalance.currency)}
                  earned="$12,450.00"
                  pending="$1,200.00"
                />
              ) : (
                <div className="nera-card p-12 text-center flex flex-col items-center justify-center border-dashed border-2">
                   <div className="w-16 h-16 rounded-3xl bg-surface flex items-center justify-center mb-4">
                     <Wallet className="w-8 h-8 text-ink-hint" />
                   </div>
                   <h3 className="font-display font-bold text-lg text-ink">No funds yet</h3>
                   <p className="text-ink-muted text-sm max-w-[260px] mt-2 mb-6">Create an invoice to start collecting payments in USD, EUR or GBP.</p>
                   <Link href="/invoices/new">
                     <NButton className="rounded-xl px-8">Create your first invoice</NButton>
                   </Link>
                </div>
              )}
            </div>

            <div className="space-y-6">
               <div className="flex items-center gap-2 pt-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-[11px] font-bold text-ink-hint uppercase tracking-[0.2em]">Quick Actions</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Link href="/invoices/new">
                  <NButton variant="navy" className="w-full justify-between h-16 px-6 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-display font-bold">New Invoice</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </NButton>
                </Link>

                <Link href="/withdrawals/new">
                  <NButton variant="outline" className="w-full justify-between h-16 px-6 group bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                        <ArrowUpRight className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-display font-bold text-ink">Withdraw</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-ink" />
                  </NButton>
                </Link>

                <Link href="/customers/new">
                  <NButton variant="outline" className="w-full justify-between h-16 px-6 group bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gold/5 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-gold" />
                      </div>
                      <span className="font-display font-bold text-ink">Add Customer</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-ink" />
                  </NButton>
                </Link>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-[11px] font-bold text-ink-hint uppercase tracking-[0.2em]">Recent Invoices</h3>
              </div>
              <Link href="/invoices">
                <NButton variant="ghost" className="text-primary hover:text-primary-mid font-bold text-xs h-8">
                  View full history <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </NButton>
              </Link>
            </div>

            <div className="nera-card overflow-hidden bg-white/50 backdrop-blur-sm">
              {invoicesLoading ? (
                <div className="p-8 space-y-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="w-full h-16 rounded-xl" />)}
                </div>
              ) : recentInvoices.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-surface flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-ink-hint" />
                  </div>
                  <h4 className="font-display font-bold text-ink">No invoice history</h4>
                  <p className="text-ink-muted text-sm mt-1">Your recent billing will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentInvoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between px-8 py-5 hover:bg-surface transition-all group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center group-hover:border-primary/20 transition-colors shadow-sm">
                          <FileText className={cn(
                             "w-5 h-5",
                             invoice.status === 'PAID' ? "text-success" : "text-primary"
                          )} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-display font-bold text-ink group-hover:text-primary transition-colors truncate">
                            {invoice.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-ink-hint uppercase tracking-wider">{invoice.invoiceNumber}</span>
                            <span className="text-[10px] text-border-mid">|</span>
                            <span className="text-[11px] font-medium text-ink-muted truncate">
                              {invoice.customer?.name || 'No Client'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="font-display font-bold text-ink tabular-nums">
                            {formatCurrency(invoice.amountMinor, invoice.currency)}
                          </p>
                          <p className="text-[10px] font-bold text-ink-hint uppercase tracking-wider mt-0.5">
                            {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
