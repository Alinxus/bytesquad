'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, Search, ExternalLink, Menu, ArrowRight, Filter } from 'lucide-react'
import { useInvoices } from '@/hooks/use-invoices'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { NButton } from '@/components/ui/NButton'
import { NInput } from '@/components/ui/NInput'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/sidebar'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { InvoiceStatus } from '@/types'

const statusFilters: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Void', value: 'VOID' },
  { label: 'Expired', value: 'EXPIRED' },
]

export default function InvoicesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeStatus, setActiveStatus] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useInvoices(activeStatus ? { status: activeStatus } : undefined)
  const invoices = data?.items || []

  const filtered = search
    ? invoices.filter(
        (inv) =>
          inv.title.toLowerCase().includes(search.toLowerCase()) ||
          inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          inv.customer?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : invoices

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
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
            <h1 className="text-xl font-display font-bold text-ink tracking-tight">Invoices</h1>
          </div>
          <Link href="/invoices/new">
            <NButton size="sm" className="h-10 px-5 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </NButton>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-8 max-w-7xl mx-auto w-full">
          {}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {}
            <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-2xl w-fit overflow-x-auto no-scrollbar">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveStatus(filter.value)}
                  className={cn(
                    "px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wider",
                    activeStatus === filter.value
                      ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                      : "text-ink-hint hover:text-ink hover:bg-white/60"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {}
            <div className="w-full lg:max-w-md">
              <NInput
                placeholder="Search by title, #ID or client name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="h-12 bg-white/50"
              />
            </div>
          </div>

          {}
          <div className="nera-card bg-white/50 backdrop-blur-sm overflow-hidden">
            {}
            <div className="hidden lg:grid grid-cols-[3fr_2fr_1.5fr_1fr_1.5fr_auto] gap-6 px-10 py-5 bg-surface/40 border-b border-border">
              {['Invoice Specification', 'Client', 'Amount', 'Status', 'Timeline', ''].map((h) => (
                <div key={h} className="text-[10px] font-bold text-ink-hint uppercase tracking-[0.2em]">
                  {h}
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className="divide-y divide-border">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="px-10 py-6">
                    <Skeleton className="h-12 w-full rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-[2.5rem] bg-surface flex items-center justify-center mb-6 shadow-sm border border-border">
                  <FileText className="w-10 h-10 text-ink-hint opacity-50" />
                </div>
                <h3 className="text-xl font-display font-bold text-ink mb-2">
                  {search ? 'No matches found' : 'Zero invoices found'}
                </h3>
                <p className="text-ink-muted text-sm max-w-[320px] mb-8 leading-relaxed">
                  {search 
                    ? `We couldn’t find any invoices matching "${search}". Try refining your keywords.` 
                    : 'Start your professional journey by creating your first global invoice today.'}
                </p>
                {!search && (
                  <Link href="/invoices/new">
                    <NButton size="lg" className="rounded-2xl px-10 h-14">
                      Create first invoice <ArrowRight className="ml-2 w-4 h-4" />
                    </NButton>
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="flex flex-col lg:grid lg:grid-cols-[3fr_2fr_1.5fr_1fr_1.5fr_auto] gap-4 lg:gap-6 items-start lg:items-center px-8 lg:px-10 py-6 hover:bg-surface transition-all group relative border-l-4 border-l-transparent hover:border-l-primary"
                  >
                    {/*
                    |---------------------------------------------------------------------------------
                    | Specification
                    |---------------------------------------------------------------------------------
                    */}
                    <div className="min-w-0">
                      <p className="font-display font-bold text-ink group-hover:text-primary transition-colors text-lg truncate">
                        {invoice.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-ink-hint uppercase tracking-wider px-2 py-0.5 bg-surface rounded border border-border group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors">
                          {invoice.invoiceNumber}
                        </span>
                      </div>
                    </div>

                    {/*
                    |---------------------------------------------------------------------------------
                    | Client
                    |---------------------------------------------------------------------------------
                    */}
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-ink-hint uppercase tracking-wider lg:hidden mb-1">Client</p>
                      <p className="text-sm font-bold text-ink truncate">
                        {invoice.customer?.name || '—'}
                      </p>
                      {invoice.customer?.email && (
                        <p className="text-[11px] font-medium text-ink-hint truncate mt-0.5">{invoice.customer.email}</p>
                      )}
                    </div>

                    {/*
                    |---------------------------------------------------------------------------------
                    | Amount
                    |---------------------------------------------------------------------------------
                    */}
                    <div>
                    <p className="text-[11px] font-bold text-ink-hint uppercase tracking-wider lg:hidden mb-1">Amount</p>
                      <p className="font-display font-bold text-ink text-lg tabular-nums">
                        {formatCurrency(invoice.amountMinor, invoice.currency)}
                      </p>
                    </div>

                    {/*
                    |---------------------------------------------------------------------------------
                    | Status
                    |---------------------------------------------------------------------------------
                    */}
                    <div>
                      <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
                    </div>

                    {/*
                    |---------------------------------------------------------------------------------
                    | Timeline
                    |---------------------------------------------------------------------------------
                    */}
                    <div>
                      <p className="text-[11px] font-bold text-ink-hint uppercase tracking-wider lg:hidden mb-1">Due Date</p>
                      <p className="text-xs font-bold text-ink">
                        {formatDate(invoice.dueDate)}
                      </p>
                      <p className="text-[10px] font-bold text-ink-hint uppercase tracking-widest mt-0.5 italic">
                        Created {formatDate(invoice.createdAt)}
                      </p>
                    </div>

                    {/*
                    |---------------------------------------------------------------------------------
                    | Action
                    |---------------------------------------------------------------------------------
                    */}
                    <div className="hidden lg:flex items-center justify-end">
                      <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-ink-hint group-hover:text-primary group-hover:border-primary/30 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 shadow-sm">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {data && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-[10px] font-bold text-ink-hint uppercase tracking-[0.2em]">
                Showing {filtered.length} of {data.total} records
              </p>
              <div className="flex items-center gap-2">
                 <NButton variant="outline" size="sm" className="h-8 text-[10px] uppercase font-bold tracking-widest bg-white" disabled>Prev</NButton>
                 <NButton variant="outline" size="sm" className="h-8 text-[10px] uppercase font-bold tracking-widest bg-white" disabled>Next</NButton>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
