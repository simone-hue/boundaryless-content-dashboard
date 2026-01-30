'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  FolderOpen,
  FileText,
  BookOpen,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Bookmark
} from 'lucide-react'

interface DashboardStats {
  sources: {
    total: number
    synced: number
    lastSync: string | null
  }
  buildLog: {
    currentWeek: string
    status: string
  }
  newsletter: {
    nextIssue: number
    status: string
  }
  readings: {
    inbox: number
    accepted: number
    total: number
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      // Fetch sources
      const sourcesRes = await fetch('/api/sources')
      const sources = await sourcesRes.json()

      const syncedSources = sources.filter((s: { lastSynced: string | null }) => s.lastSynced !== null)
      const lastSync = syncedSources.length > 0
        ? syncedSources.reduce((latest: { lastSynced: string }, s: { lastSynced: string }) =>
            new Date(s.lastSynced) > new Date(latest.lastSynced) ? s : latest
          ).lastSynced
        : null

      // Fetch readings count
      const readingsRes = await fetch('/api/readings/count')
      const readingsCounts = await readingsRes.json()

      // Get current week
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
      const weekString = weekStart.toISOString().split('T')[0]

      setStats({
        sources: {
          total: sources.length,
          synced: syncedSources.length,
          lastSync,
        },
        buildLog: {
          currentWeek: weekString,
          status: 'Not started',
        },
        newsletter: {
          nextIssue: 1,
          status: 'Planning',
        },
        readings: {
          inbox: readingsCounts.inbox || 0,
          accepted: readingsCounts.accepted || 0,
          total: readingsCounts.total || 0,
        },
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Dashboard"
        description="Content production overview"
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Status Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Sources Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sources</CardTitle>
              <FolderOpen className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.sources.synced}/{stats?.sources.total}
              </div>
              <p className="text-xs text-slate-500">
                synced sources
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                Last sync: {formatDate(stats?.sources.lastSync ?? null)}
              </div>
              <Link href="/sources">
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  View Sources
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Build Log Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Build Log</CardTitle>
              <FileText className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Week of {stats?.buildLog.currentWeek}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  {stats?.buildLog.status}
                </Badge>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Capture insights from client work, development, and reading
              </p>
              <Link href="/build-log">
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  Edit Build Log
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Readings Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Readings</CardTitle>
              <Bookmark className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.readings.inbox || 0}
              </div>
              <p className="text-xs text-slate-500">
                in inbox
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="h-3 w-3" />
                {stats?.readings.accepted || 0} accepted
              </div>
              <Link href="/readings">
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  View Readings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Newsletter Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Newsletter</CardTitle>
              <BookOpen className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Issue #{stats?.newsletter.nextIssue}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {stats?.newsletter.status}
                </Badge>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                From Frameworks to Flows
              </p>
              <Link href="/newsletter">
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  View Newsletter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/sources">
              <Card className="cursor-pointer transition-colors hover:bg-slate-50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <RefreshCw className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Sync Sources</p>
                    <p className="text-sm text-slate-500">Update from BlessStrategy</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/build-log">
              <Card className="cursor-pointer transition-colors hover:bg-slate-50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">Add Build Log</p>
                    <p className="text-sm text-slate-500">Capture weekly insights</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/readings">
              <Card className="cursor-pointer transition-colors hover:bg-slate-50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-pink-100 p-2">
                    <Bookmark className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-medium">Review Readings</p>
                    <p className="text-sm text-slate-500">{stats?.readings.inbox || 0} in inbox</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="cursor-not-allowed opacity-50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-blue-100 p-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Draft Newsletter</p>
                  <p className="text-sm text-slate-500">Coming in v0.5</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-not-allowed opacity-50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-green-100 p-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Generate Social</p>
                  <p className="text-sm text-slate-500">Coming in v0.7</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Workflow Overview */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Content Workflow</h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Sources</p>
                    <p className="text-sm text-slate-500">{stats?.sources.synced} synced</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300" />
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">Build Log</p>
                    <p className="text-sm text-slate-500">Pending</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300" />
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <AlertCircle className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium">Newsletter</p>
                    <p className="text-sm text-slate-500">Not started</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300" />
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <AlertCircle className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium">Social</p>
                    <p className="text-sm text-slate-500">Not started</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
