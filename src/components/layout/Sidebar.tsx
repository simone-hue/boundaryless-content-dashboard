'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Settings,
  FolderOpen,
  Bookmark
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Sources', href: '/sources', icon: FolderOpen },
  { name: 'Build Log', href: '/build-log', icon: FileText },
  { name: 'Readings', href: '/readings', icon: Bookmark, badge: true },
  { name: 'Newsletter', href: '/newsletter', icon: BookOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [inboxCount, setInboxCount] = useState(0)

  useEffect(() => {
    async function fetchInboxCount() {
      try {
        const res = await fetch('/api/readings/count')
        const data = await res.json()
        setInboxCount(data.inbox || 0)
      } catch {
        // Silently fail
      }
    }
    fetchInboxCount()
    // Refresh every 30 seconds
    const interval = setInterval(fetchInboxCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold text-white">Boundaryless</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
              {item.badge && inboxCount > 0 && (
                <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {inboxCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <p className="text-xs text-slate-500">
          Content Dashboard v0.3
        </p>
      </div>
    </div>
  )
}
