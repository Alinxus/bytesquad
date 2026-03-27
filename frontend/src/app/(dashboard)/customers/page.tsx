'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Users, Search, Trash2, Menu, ArrowRight, UserPlus, Mail, Building2, MapPin } from 'lucide-react'
import { useCustomers, useDeleteCustomer } from '@/hooks/use-customers'
import { NButton } from '@/components/ui/NButton'
import { NInput } from '@/components/ui/NInput'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/sidebar'
import { getCountryFlag, formatDate, getInitials, cn } from '@/lib/utils'
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
    <div className="flex h-screen bg-background overflow-hidden font-sans text-ink">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/*
        |---------------------------------------------------------------------------------
        | Header
        |---------------------------------------------------------------------------------
        */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-8 bg-white/80 backdrop-blur-xl border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <button
               onClick={() => setSidebarOpen(true)}
               className="lg:hidden p-2 rounded-xl text-ink-hint hover:text-ink hover:bg-surface transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-display font-bold text-ink tracking-tight">Customer Network</h1>
          </div>
          <Link href="/customers/new">
            <NButton size="sm" className="h-10 px-5 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </NButton>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-8 max-w-7xl mx-auto w-full relative">

          {/*
          |---------------------------------------------------------------------------------
          | Controls Bar
          |---------------------------------------------------------------------------------
          */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="w-full lg:max-w-md">
              <NInput
                placeholder="Find a customer or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="h-12 bg-white/50"
              />
            </div>
            
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-xl border border-border">
                  <span className="text-[10px] font-bold text-ink-hint uppercase tracking-widest">Total Active</span>
                  <span className="text-xs font-display font-bold text-primary">{customers.length}</span>
               </div>
            </div>
          </div>

          {/*
          |---------------------------------------------------------------------------------
          | Customers Content
          |---------------------------------------------------------------------------------
          */}
          <div className="nera-card bg-white/50 backdrop-blur-sm overflow-hidden relative z-10">
            {/*
            |---------------------------------------------------------------------------------
            | Table Header (Desktop)
            |---------------------------------------------------------------------------------
            */}
            <div className="hidden lg:grid grid-cols-[2.5fr_2fr_1.5fr_1fr_auto] gap-6 px-10 py-5 bg-surface/40 border-b border-border">
              {['Profile / Identity', 'Email Address', 'Corporate Entity', 'Region', ''].map((h) => (
                <div key={h} className="text-[10px] font-bold text-ink-hint uppercase tracking-[0.2em]">
                  {h}
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className="divide-y divide-border">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="px-10 py-8">
                    <Skeleton className="h-12 w-full rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-[2.5rem] bg-surface flex items-center justify-center mb-6 shadow-sm border border-border">
                  <UserPlus className="w-10 h-10 text-ink-hint opacity-50" />
                </div>
                <h3 className="text-xl font-display font-bold text-ink mb-2">
                  {search ? 'Identity mismatch' : 'Empty Network'}
                </h3>
                <p className="text-ink-muted text-sm max-w-[320px] mb-8 leading-relaxed">
                  {search 
                    ? `We couldn’t locate any records for "${search}". Verify the spelling and try again.` 
                    : 'Your customer database is currently empty. Scale your business by adding your first lead.'}
                </p>
                {!search && (
                  <Link href="/customers/new">
                    <NButton size="lg" className="rounded-2xl px-10 h-14">
                      Create first record <ArrowRight className="ml-2 w-4 h-4" />
                    </NButton>
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex flex-col lg:grid lg:grid-cols-[2.5fr_2fr_1.5fr_1fr_auto] gap-4 lg:gap-6 items-start lg:items-center px-8 lg:px-10 py-6 hover:bg-surface transition-all group relative border-l-4 border-l-transparent hover:border-l-primary"
                  >
                    {/*
                    |---------------------------------------------------------------------------------
                    | Identity
                    |---------------------------------------------------------------------------------
                    */}
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar className="w-12 h-12 shrink-0 rounded-2xl border border-border bg-white shadow-sm group-hover:border-primary/20 transition-all group-hover:scale-105">
                        <AvatarFallback className="text-xs font-bold text-primary bg-primary/5 uppercase">{getInitials(customer.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-ink group-hover:text-primary transition-colors text-lg truncate">
                          {customer.name}
                        </p>
                        <p className="text-[10px] font-bold text-ink-hint uppercase tracking-widest mt-0.5">
                          Member since {formatDate(customer.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/*
                    |---------------------------------------------------------------------------------
                    | Email
                    |---------------------------------------------------------------------------------
                    */}
                    <div className="min-w-0">
                       <p className="text-[11px] font-bold text-ink-hint uppercase tracking-wider lg:hidden mb-1 flex items-center gap-1.5">
                          <Mail size={12} /> Email
                       </p>
                       <p className="text-sm font-bold text-ink truncate tabular-nums">
                        {customer.email}
                      </p>
                    </div>

                    {/*
                    |---------------------------------------------------------------------------------
                    | Corporate Entity
                    |---------------------------------------------------------------------------------
                    */}
                    <div className="min-w-0">
                       <p className="text-[11px] font-bold text-ink-hint uppercase tracking-wider lg:hidden mb-1 flex items-center gap-1.5">
                          <Building2 size={12} /> Entity
                       </p>
                       <p className="text-sm font-bold text-ink truncate">
                        {customer.companyName || <span className="text-ink-hint/40 italic">— INDIVIDUAL —</span>}
                      </p>
                    </div>

                    {/*
                    |---------------------------------------------------------------------------------
                    | Region
                    |---------------------------------------------------------------------------------
                    */}
                    <div>
                       <p className="text-[11px] font-bold text-ink-hint uppercase tracking-wider lg:hidden mb-1 flex items-center gap-1.5">
                          <MapPin size={12} /> Region
                       </p>
                       <div className="flex items-center gap-2">
                          <span className="text-lg leading-none">{customer.countryCode ? getCountryFlag(customer.countryCode) : '—'}</span>
                          <span className="text-sm font-bold text-ink uppercase tracking-widest">{customer.countryCode || ''}</span>
                       </div>
                    </div>

                    {/*
                    |---------------------------------------------------------------------------------
                    | Actions
                    |---------------------------------------------------------------------------------
                    */}
                    <div className="flex items-center justify-end w-full lg:w-auto">
                      <button
                        onClick={() => handleDelete(customer.id, customer.name)}
                        className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-ink-hint hover:text-danger hover:border-danger/30 transition-all opacity-0 lg:opacity-0 group-hover:opacity-100 shadow-sm"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {data && filtered.length > 0 && (
             <div className="flex items-center justify-between pt-4">
                <p className="text-[10px] font-bold text-ink-hint uppercase tracking-[0.2em]">
                  Archived visibility: {filtered.length} active global records
                </p>
             </div>
          )}
        </main>
      </div>
    </div>
  )
}
