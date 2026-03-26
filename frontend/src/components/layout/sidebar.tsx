'use client'

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
  Zap,
  X,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
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
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 lg:z-auto',
          'w-[240px] shrink-0',
          'bg-surface border-r border-border',
          'flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:h-screen',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center shadow-md shadow-accent/20 group-hover:shadow-accent/35 transition-shadow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-text-primary tracking-tight">Nera</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <nav className="px-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                    active
                      ? 'bg-accent/10 text-accent-light border-l-2 border-accent pl-[10px]'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary border-l-2 border-transparent pl-[10px]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      active ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* User section */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex items-center gap-3 mb-3 px-1">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="text-xs bg-accent/15 text-accent-light font-semibold">
                {user ? getInitials(user.fullName) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate leading-tight">
                {workspace?.businessName || user?.fullName || 'User'}
              </p>
              <p className="text-xs text-text-muted truncate leading-tight mt-0.5">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-text-muted hover:text-error hover:bg-error/8 gap-2 text-xs font-medium"
            onClick={() => logout()}
            loading={isLoggingOut}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  )
}
