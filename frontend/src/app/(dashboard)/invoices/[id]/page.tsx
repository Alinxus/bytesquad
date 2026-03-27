'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Copy, ExternalLink, Link2, Check, Menu, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/sidebar'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { useInvoice, useCreateCheckout, useVoidInvoice } from '@/hooks/use-invoices'
import { formatCurrency, formatDate, copyToClipboard } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data: invoice, isLoading } = useInvoice(id)
  const createCheckout = useCreateCheckout()
  const voidInvoice = useVoidInvoice()

  const checkoutSession = invoice?.checkoutSession

  const handleCopyLink = async () => {
    if (!checkoutSession?.checkoutUrl) return
    const success = await copyToClipboard(checkoutSession.checkoutUrl)
    if (success) {
      setCopied(true)
      toast({ title: 'Copied!', description: 'Checkout link copied to clipboard.' })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleGenerateCheckout = () => {
    createCheckout.mutate(id)
  }

  const handleVoid = () => {
    if (confirm('Are you sure you want to void this invoice? This cannot be undone.')) {
      voidInvoice.mutate(id, {
        onSuccess: () => router.push('/invoices'),
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="sticky top-0 z-30 flex items-center gap-4 h-16 px-6 bg-background/80 backdrop-blur-md border-b border-border">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-40 h-5 rounded" />
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="w-64 h-8 rounded" />
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-text-primary font-medium mb-2">Invoice not found</p>
          <Link href="/invoices"><Button variant="secondary">Back to Invoices</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/invoices" className="text-text-muted hover:text-text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-text-primary truncate max-w-[200px]">{invoice.title}</h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {invoice.status === 'OPEN' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleVoid}
                loading={voidInvoice.isPending}
                className="text-error border-error/20 hover:bg-error/10 hover:text-error"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Void</span>
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <div className="max-w-4xl mx-auto space-y-6">

            {}
            <div className="rounded-xl bg-surface border border-border p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs text-text-muted font-mono mb-1">{invoice.invoiceNumber}</p>
                  <h2 className="text-2xl font-bold text-text-primary">{invoice.title}</h2>
                  {invoice.description && (
                    <p className="text-text-secondary mt-2 text-sm">{invoice.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted mb-1">Amount Due</p>
                  <p className="text-3xl font-bold text-text-primary">
                    {formatCurrency(invoice.amountMinor, invoice.currency)}
                  </p>
                  {invoice.status === 'PAID' && (
                    <p className="text-sm text-success mt-1">Paid</p>
                  )}
                </div>
              </div>

              {}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Customer', value: invoice.customer?.name || '—' },
                  { label: 'Email', value: invoice.customer?.email || '—' },
                  { label: 'Currency', value: invoice.currency },
                  { label: 'Created', value: formatDate(invoice.createdAt) },
                  { label: 'Due Date', value: formatDate(invoice.dueDate) },
                  { label: 'Paid At', value: formatDate(invoice.paidAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-surface-2 p-3">
                    <p className="text-xs text-text-muted mb-1">{label}</p>
                    <p className="text-sm font-medium text-text-primary">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {}
            {invoice.allowedMethods && invoice.allowedMethods.length > 0 && (
              <div className="rounded-xl bg-surface border border-border p-5">
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
                  Payment Methods
                </h3>
                <div className="flex flex-wrap gap-2">
                  {invoice.allowedMethods.map((method) => (
                    <span
                      key={method}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent-light border border-accent/20"
                    >
                      {method.replace('_', ' ')}
                    </span>
                  ))}
                  {invoice.providerPreference && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-2 text-text-secondary border border-border">
                      via {invoice.providerPreference}
                    </span>
                  )}
                </div>
              </div>
            )}

            {}
            <div className="rounded-xl bg-surface border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                  Checkout Link
                </h3>
                {!checkoutSession && invoice.status === 'OPEN' && (
                  <Button
                    size="sm"
                    onClick={handleGenerateCheckout}
                    loading={createCheckout.isPending}
                  >
                    <Link2 className="w-4 h-4" />
                    Generate Link
                  </Button>
                )}
              </div>

              {checkoutSession ? (
                <div className="space-y-4">
                  {}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Session Status</span>
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                        checkoutSession.status === 'CREATED' || checkoutSession.status === 'PENDING'
                          ? 'bg-success/10 text-success border-success/20'
                          : checkoutSession.status === 'PAID'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-error/10 text-error border-error/20'
                      }`}
                    >
                      {checkoutSession.status}
                    </span>
                  </div>

                  {/*
                  |---------------------------------------------------------------------------------
                  | URL
                  |---------------------------------------------------------------------------------
                  */}
                  <div className="rounded-lg bg-surface-2 border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-accent-light font-mono truncate flex-1">
                        {checkoutSession.checkoutUrl}
                      </p>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={handleCopyLink}
                          className="hover:bg-accent/10 hover:text-accent-light"
                        >
                          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <a href={checkoutSession.checkoutUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="icon-sm" variant="ghost" className="hover:bg-accent/10 hover:text-accent-light">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/*
                  |---------------------------------------------------------------------------------
                  | Expiry
                  |---------------------------------------------------------------------------------
                  */}
                  {checkoutSession.expiresAt && (
                    <p className="text-xs text-text-muted">
                      Expires: {formatDate(checkoutSession.expiresAt, 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-3">
                    <Link2 className="w-5 h-5 text-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-text-primary mb-1">No checkout link yet</p>
                  <p className="text-xs text-text-muted mb-4">
                    {invoice.status === 'OPEN'
                      ? 'Generate a checkout link to share with your customer'
                      : 'Only open invoices can have checkout links'}
                  </p>
                  {invoice.status === 'OPEN' && (
                    <Button size="sm" onClick={handleGenerateCheckout} loading={createCheckout.isPending}>
                      <Link2 className="w-4 h-4" />
                      Generate Checkout Link
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
