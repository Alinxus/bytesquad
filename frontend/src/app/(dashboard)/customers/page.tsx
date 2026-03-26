'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Users, Search, Trash2, Menu } from 'lucide-react'
import { useCustomers, useDeleteCustomer } from '@/hooks/use-customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/sidebar'
import { getCountryFlag, formatDate, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function CustomersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useCustomers()
  const deleteCustomer = useDeleteCustomer()

  const customers = data?.items || []
  const filtered = search
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase()) ||
          c.companyName?.toLowerCase().includes(search.toLowerCase())
      )
    : customers

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove ${name} from your customers?`)) {
      deleteCustomer.mutate(id)
    }
  }

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
            <h1 className="text-lg font-semibold text-text-primary">Customers</h1>
          </div>
          <Link href="/customers/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {/* Search */}
          <div className="relative max-w-sm mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Customers list */}
          <div className="rounded-xl bg-surface border border-border overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2.5fr_2fr_1.5fr_1fr_auto] gap-4 px-5 py-3 bg-surface-2/50 border-b border-border">
              {['Customer', 'Email', 'Company', 'Country', ''].map((h) => (
                <div key={h} className="text-xs font-medium text-text-muted uppercase tracking-wider">{h}</div>
              ))}
            </div>

            {isLoading ? (
              <div className="divide-y divide-border">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1.5" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-4 w-24 hidden md:block" />
                    <Skeleton className="h-4 w-8 hidden md:block" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-text-muted" />
                </div>
                <p className="text-sm font-medium text-text-primary mb-1">
                  {search ? 'No customers found' : 'No customers yet'}
                </p>
                <p className="text-xs text-text-muted mb-4">
                  {search ? 'Try a different search term' : 'Add your first customer to create invoices'}
                </p>
                {!search && (
                  <Link href="/customers/new">
                    <Button size="sm">
                      <Plus className="w-4 h-4" />
                      Add Customer
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex flex-col md:grid md:grid-cols-[2.5fr_2fr_1.5fr_1fr_auto] gap-2 md:gap-4 items-start md:items-center px-5 py-4 hover:bg-surface-2/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-9 h-9 shrink-0">
                        <AvatarFallback className="text-xs">{getInitials(customer.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{customer.name}</p>
                        <p className="text-xs text-text-muted">{formatDate(customer.createdAt)}</p>
                      </div>
                    </div>

                    <p className="text-sm text-text-secondary truncate">{customer.email}</p>

                    <p className="text-sm text-text-secondary truncate">
                      {customer.companyName || '—'}
                    </p>

                    <p className="text-sm text-text-secondary">
                      {customer.countryCode ? getCountryFlag(customer.countryCode) : '—'}
                    </p>

                    <button
                      onClick={() => handleDelete(customer.id, customer.name)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
