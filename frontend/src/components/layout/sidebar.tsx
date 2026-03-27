'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Users,
  ArrowUpRight,
  CreditCard,
  Shield,
  BarChart2,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NButton } from '@/components/ui/NButton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NCowrieMark } from '@/components/ui/NCowrieMark'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Withdrawals', href: '/withdrawals', icon: ArrowUpRight },
  { label: 'Payout Accounts', href: '/payout-accounts', icon: CreditCard },
  { label: 'KYC', href: '/kyc', icon: Shield },
  { label: 'Reports', href: '/reports', icon: BarChart2 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, workspace, logout, isLoggingOut } = useAuth()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {}
      {isOpen && (
        <div
          className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 lg:z-auto',
          'w-[260px] shrink-0',
          'bg-white border-r border-border',
          'flex flex-col font-sans',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:h-screen',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {}
        <div className="flex items-center justify-between px-6 py-8 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={onClose}>
            <span className="text-xl font-display font-bold text-primary tracking-tight">nera</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-ink-hint hover:text-ink hover:bg-surface transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {}
        <ScrollArea className="flex-1 px-4">
          <p className="px-4 mb-4 text-[10px] font-bold text-ink-hint uppercase tracking-[0.2em]">
            Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative',
                    active
                      ? 'bg-primary/5 text-primary'
                      : 'text-ink-muted hover:bg-surface hover:text-ink'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      active ? 'text-primary' : 'text-ink-hint group-hover:text-ink-muted'
                    )}
                  />
                  <span>{item.label}</span>
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                  )}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {}
        <div className="p-6 mt-auto border-t border-border bg-surface/30">
          <div className="flex items-center gap-3 mb-6">
            <Avatar className="w-10 h-10 border-2 border-white shadow-sm ring-1 ring-border">
              <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold font-display uppercase">
                {user ? getInitials(user.fullName) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink truncate leading-tight">
                {workspace?.businessName || user?.fullName || 'User'}
              </p>
              <p className="text-[11px] font-medium text-ink-hint truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
          <NButton
            variant="outline"
            size="sm"
            className="w-full justify-center h-10 text-ink-muted hover:text-danger hover:border-danger/20 hover:bg-danger-bg gap-2 text-xs"
            onClick={() => logout()}
            loading={isLoggingOut}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </NButton>
        </div>
      </aside>
    </>
  )
}
