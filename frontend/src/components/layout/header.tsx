'use client'

import { Menu, Bell } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
  actions?: React.ReactNode
}

export function Header({ title, onMenuClick, actions }: HeaderProps) {
  const { user, workspace } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className={cn(
            'lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors'
          )}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
          {workspace && (
            <p className="text-xs text-text-muted hidden sm:block">
              {workspace.businessName} · {workspace.baseCurrency}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary hidden md:block">
            Hey, {user?.fullName?.split(' ')[0] || 'there'} 👋
          </span>
        </div>
      </div>
    </header>
  )
}
