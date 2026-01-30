'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface HeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    loading?: boolean
  }
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {action && (
          <Button onClick={action.onClick} disabled={action.loading}>
            {action.loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}
