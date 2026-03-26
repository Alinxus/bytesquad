'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, Search, ExternalLink, Menu } from 'lucide-react'
import { useInvoices } from '@/hooks/use-invoices'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/sidebar'
import { formatCurrency, formatDate } from '@/lib/utils'
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
            <h1 className="text-lg font-semibold text-text-primary">Invoices</h1>
          </div>
          <Link href="/invoices/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Status tabs */}
            <div className="flex gap-1 bg-surface-2 rounded-lg p-1 overflow-x-auto no-scrollbar shrink-0">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveStatus(filter.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeStatus === filter.value
                      ? 'bg-surface-3 text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl bg-surface border border-border overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-surface-2/50 border-b border-border">
              {['Invoice', 'Customer', 'Amount', 'Status', 'Due Date', ''].map((h) => (
                <div key={h} className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  {h}
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className="divide-y divide-border">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4">
                    <div>
                      <Skeleton className="h-4 w-32 mb-1.5" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-text-muted" />
                </div>
                <p className="text-sm font-medium text-text-primary mb-1">
                  {search ? 'No invoices found' : 'No invoices yet'}
                </p>
                <p className="text-xs text-text-muted mb-4">
                  {search ? 'Try adjusting your search' : 'Create your first invoice to get started'}
                </p>
                {!search && (
                  <Link href="/invoices/new">
                    <Button size="sm">
                      <Plus className="w-4 h-4" />
                      New Invoice
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="flex flex-col md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 items-start md:items-center px-5 py-4 hover:bg-surface-2/50 transition-colors group"
                  >
                    {/* Invoice info */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent-light transition-colors">
                        {invoice.title}
                      </p>
                      <p className="text-xs text-text-muted font-mono">{invoice.invoiceNumber}</p>
                    </div>

                    {/* Customer */}
                    <p className="text-sm text-text-secondary truncate">
                      {invoice.customer?.name || '—'}
                    </p>

                    {/* Amount */}
                    <p className="text-sm font-semibold text-text-primary">
                      {formatCurrency(invoice.amountMinor, invoice.currency)}
                    </p>

                    {/* Status */}
                    <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />

                    {/* Due date */}
                    <p className="text-sm text-text-secondary">
                      {formatDate(invoice.dueDate)}
                    </p>

                    {/* Action */}
                    <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-accent-light transition-colors hidden md:block" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {data && (
            <p className="text-xs text-text-muted mt-3">
              Showing {filtered.length} of {data.total} invoices
            </p>
          )}
        </main>
      </div>
    </div>
  )
}
