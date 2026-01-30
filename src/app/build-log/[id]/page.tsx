'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  RefreshCw,
  Save,
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  Code,
  Lightbulb,
  BookOpen,
} from 'lucide-react'

interface BuildLogEntry {
  id: string
  weekStart: string
  weekEnd: string
  clientWork: string | null
  softwareDev: string | null
  prototyping: string | null
  reading: string | null
  voiceTranscript: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export default function BuildLogEditorPage() {
  const params = useParams()
  const router = useRouter()
  const [entry, setEntry] = useState<BuildLogEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Form state
  const [clientWork, setClientWork] = useState('')
  const [softwareDev, setSoftwareDev] = useState('')
  const [prototyping, setPrototyping] = useState('')
  const [reading, setReading] = useState('')
  const [status, setStatus] = useState('draft')

  const fetchEntry = useCallback(async () => {
    try {
      const res = await fetch(`/api/build-log/${params.id}`)
      if (!res.ok) {
        router.push('/build-log')
        return
      }
      const data = await res.json()
      setEntry(data)
      setClientWork(data.clientWork || '')
      setSoftwareDev(data.softwareDev || '')
      setPrototyping(data.prototyping || '')
      setReading(data.reading || '')
      setStatus(data.status)
    } catch (error) {
      console.error('Failed to fetch entry:', error)
      router.push('/build-log')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchEntry()
  }, [fetchEntry])

  async function saveEntry() {
    setSaving(true)
    try {
      const res = await fetch(`/api/build-log/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientWork,
          softwareDev,
          prototyping,
          reading,
          status,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setEntry(updated)
        setHasChanges(false)
      }
    } catch (error) {
      console.error('Failed to save entry:', error)
    } finally {
      setSaving(false)
    }
  }

  async function finalizeEntry() {
    setStatus('finalized')
    setSaving(true)
    try {
      const res = await fetch(`/api/build-log/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientWork,
          softwareDev,
          prototyping,
          reading,
          status: 'finalized',
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setEntry(updated)
        setHasChanges(false)
      }
    } catch (error) {
      console.error('Failed to finalize entry:', error)
    } finally {
      setSaving(false)
    }
  }

  function handleChange(setter: (value: string) => void) {
    return (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setter(e.target.value)
      setHasChanges(true)
    }
  }

  function formatWeekRange(start: string, end: string) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${startDate.getFullYear()}`
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!entry) {
    return null
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        title={`Week of ${formatWeekRange(entry.weekStart, entry.weekEnd)}`}
        description="Capture weekly insights from your work"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/build-log')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={saveEntry}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Draft
            </Button>
            {status !== 'finalized' && (
              <Button onClick={finalizeEntry} disabled={saving}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Finalize
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 flex items-center gap-2">
          {status === 'draft' ? (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">Draft</Badge>
          ) : (
            <Badge variant="secondary" className="bg-green-100 text-green-800">Finalized</Badge>
          )}
          {hasChanges && (
            <span className="text-sm text-slate-500">Unsaved changes</span>
          )}
        </div>

        <Tabs defaultValue="client" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="client" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Client Work</span>
            </TabsTrigger>
            <TabsTrigger value="software" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Software</span>
            </TabsTrigger>
            <TabsTrigger value="prototyping" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Prototyping</span>
            </TabsTrigger>
            <TabsTrigger value="reading" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Reading</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="client" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="h-5 w-5" />
                  Client Work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={clientWork}
                  onChange={handleChange(setClientWork)}
                  placeholder="What challenges did you help clients solve this week? What patterns emerged?"
                  className="min-h-[300px] w-full resize-none rounded-md border border-slate-200 p-3 text-sm focus:border-slate-400 focus:outline-none"
                  disabled={status === 'finalized'}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Template: Client (anonymous), Challenge, Pattern Emerged, Insight
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="software" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Code className="h-5 w-5" />
                  Software Development
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={softwareDev}
                  onChange={handleChange(setSoftwareDev)}
                  placeholder="What features did you build? What changed in O2A/EMCos?"
                  className="min-h-[300px] w-full resize-none rounded-md border border-slate-200 p-3 text-sm focus:border-slate-400 focus:outline-none"
                  disabled={status === 'finalized'}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Template: Feature Name, What Changed, O2A Impact
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prototyping" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-5 w-5" />
                  Prototyping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={prototyping}
                  onChange={handleChange(setPrototyping)}
                  placeholder="What experiments did you run? What did you learn?"
                  className="min-h-[300px] w-full resize-none rounded-md border border-slate-200 p-3 text-sm focus:border-slate-400 focus:outline-none"
                  disabled={status === 'finalized'}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Template: Experiment Name, Hypothesis, Result
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reading" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-5 w-5" />
                  Reading
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={reading}
                  onChange={handleChange(setReading)}
                  placeholder="What did you read this week? How does it connect to your thesis?"
                  className="min-h-[300px] w-full resize-none rounded-md border border-slate-200 p-3 text-sm focus:border-slate-400 focus:outline-none"
                  disabled={status === 'finalized'}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Template: Title - One sentence connection to thesis
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
