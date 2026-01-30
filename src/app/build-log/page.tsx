'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Plus,
  RefreshCw,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
} from 'lucide-react'

interface BuildLogEntry {
  id: string
  weekStart: string
  weekEnd: string
  clientWork: string | null
  softwareDev: string | null
  prototyping: string | null
  reading: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export default function BuildLogPage() {
  const [entries, setEntries] = useState<BuildLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchEntries()
  }, [])

  async function fetchEntries() {
    try {
      const res = await fetch('/api/build-log')
      const data = await res.json()
      setEntries(data)
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createCurrentWeekEntry() {
    setCreating(true)
    try {
      // Get Monday of current week
      const now = new Date()
      const dayOfWeek = now.getDay()
      const monday = new Date(now)
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      monday.setHours(0, 0, 0, 0)

      const res = await fetch('/api/build-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart: monday.toISOString() }),
      })

      if (res.ok) {
        await fetchEntries()
      } else {
        const data = await res.json()
        if (res.status === 409 && data.entry) {
          // Entry already exists, just refresh
          await fetchEntries()
        }
      }
    } catch (error) {
      console.error('Failed to create entry:', error)
    } finally {
      setCreating(false)
    }
  }

  function formatWeekRange(start: string, end: string) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${startDate.getFullYear()}`
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Draft</Badge>
      case 'finalized':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Finalized</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  function countFilledSections(entry: BuildLogEntry) {
    let count = 0
    if (entry.clientWork) count++
    if (entry.softwareDev) count++
    if (entry.prototyping) count++
    if (entry.reading) count++
    return count
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
        title="Build Log"
        description="Weekly development insights"
        action={
          <Button onClick={createCurrentWeekEntry} disabled={creating}>
            {creating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            New Week
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">No build logs yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Create your first build log entry for this week
            </p>
            <Button onClick={createCurrentWeekEntry} className="mt-4" disabled={creating}>
              {creating ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Build Log
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Link key={entry.id} href={`/build-log/${entry.id}`}>
                <Card className="cursor-pointer transition-colors hover:bg-slate-50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                        <Calendar className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Week of {formatWeekRange(entry.weekStart, entry.weekEnd)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {countFilledSections(entry)}/4 sections filled
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(entry.status)}
                      {entry.status === 'finalized' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
