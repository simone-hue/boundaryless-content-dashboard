'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  RefreshCw,
  ExternalLink,
  Check,
  Archive,
  Sparkles,
  BookOpen,
  Tag,
  Lightbulb,
  Trash2,
} from 'lucide-react'

interface Reading {
  id: string
  url: string
  title: string
  excerpt: string | null
  aiRelevance: string | null
  aiChapters: string[]
  aiTags: string[]
  aiAngle: string | null
  userNote: string | null
  userTags: string[]
  status: string
  processedAt: string | null
  createdAt: string
}

interface ReadingCounts {
  inbox: number
  accepted: number
  archived: number
  used: number
}

export default function ReadingsPage() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [counts, setCounts] = useState<ReadingCounts>({ inbox: 0, accepted: 0, archived: 0, used: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('inbox')
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  const fetchReadings = useCallback(async (status: string) => {
    try {
      const res = await fetch(`/api/readings?status=${status}`)
      const data = await res.json()
      setReadings(data.readings || [])
    } catch (error) {
      console.error('Failed to fetch readings:', error)
    }
  }, [])

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/readings/count')
      const data = await res.json()
      setCounts(data)
    } catch (error) {
      console.error('Failed to fetch counts:', error)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchReadings(activeTab), fetchCounts()]).finally(() => {
      setLoading(false)
    })
  }, [activeTab, fetchReadings, fetchCounts])

  async function handleAnalyze(id: string) {
    setAnalyzingId(id)
    try {
      const res = await fetch(`/api/readings/${id}/analyze`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setReadings(prev =>
          prev.map(r => (r.id === id ? data.reading : r))
        )
      }
    } catch (error) {
      console.error('Failed to analyze:', error)
    } finally {
      setAnalyzingId(null)
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/readings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setReadings(prev => prev.filter(r => r.id !== id))
        fetchCounts()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this reading?')) return
    try {
      const res = await fetch(`/api/readings/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setReadings(prev => prev.filter(r => r.id !== id))
        fetchCounts()
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  async function handleSaveNote(id: string) {
    try {
      const res = await fetch(`/api/readings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userNote: noteText }),
      })
      if (res.ok) {
        const updated = await res.json()
        setReadings(prev =>
          prev.map(r => (r.id === id ? updated : r))
        )
        setEditingNoteId(null)
        setNoteText('')
      }
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  function getDomain(url: string) {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
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
        title="Readings"
        description="Curated articles with AI-powered relevance analysis"
        action={
          <Button variant="outline" onClick={() => { fetchReadings(activeTab); fetchCounts(); }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); fetchReadings(v); }}>
          <TabsList className="mb-4">
            <TabsTrigger value="inbox">
              Inbox {counts.inbox > 0 && <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">{counts.inbox}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted {counts.accepted > 0 && <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">{counts.accepted}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger value="used">Used</TabsTrigger>
          </TabsList>

          {['inbox', 'accepted', 'archived', 'used'].map(status => (
            <TabsContent key={status} value={status} className="space-y-4">
              {readings.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-4">No readings in {status}</p>
                  {status === 'inbox' && (
                    <p className="mt-2 text-sm">Use the bookmarklet to save articles while browsing</p>
                  )}
                </div>
              ) : (
                readings.map(reading => (
                  <Card key={reading.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <a
                            href={reading.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2 text-lg font-medium hover:text-blue-600"
                          >
                            {reading.title}
                            <ExternalLink className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                          </a>
                          <p className="mt-1 text-sm text-slate-500">
                            {getDomain(reading.url)} · {formatDate(reading.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Excerpt */}
                      {reading.excerpt && (
                        <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                          {reading.excerpt}
                        </p>
                      )}

                      {/* AI Analysis */}
                      {reading.processedAt ? (
                        <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-3">
                          <div className="flex items-start gap-2">
                            <Sparkles className="mt-0.5 h-4 w-4 text-purple-500" />
                            <div>
                              <p className="text-xs font-medium text-slate-500">AI Relevance</p>
                              <p className="text-sm">{reading.aiRelevance}</p>
                            </div>
                          </div>

                          {reading.aiChapters.length > 0 && (
                            <div className="flex items-start gap-2">
                              <BookOpen className="mt-0.5 h-4 w-4 text-blue-500" />
                              <div>
                                <p className="text-xs font-medium text-slate-500">Book Chapters</p>
                                <p className="text-sm">{reading.aiChapters.join(', ')}</p>
                              </div>
                            </div>
                          )}

                          {reading.aiTags.length > 0 && (
                            <div className="flex items-start gap-2">
                              <Tag className="mt-0.5 h-4 w-4 text-green-500" />
                              <div className="flex flex-wrap gap-1">
                                {reading.aiTags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {reading.aiAngle && (
                            <div className="flex items-start gap-2">
                              <Lightbulb className="mt-0.5 h-4 w-4 text-amber-500" />
                              <div>
                                <p className="text-xs font-medium text-slate-500">Newsletter Angle</p>
                                <p className="text-sm">{reading.aiAngle}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAnalyze(reading.id)}
                            disabled={analyzingId === reading.id}
                          >
                            {analyzingId === reading.id ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Analyze with AI
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* User Note */}
                      <div className="mt-4">
                        {editingNoteId === reading.id ? (
                          <div className="flex gap-2">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Add your note..."
                              className="flex-1 rounded-md border border-slate-200 p-2 text-sm focus:border-slate-400 focus:outline-none"
                              rows={2}
                            />
                            <div className="flex flex-col gap-1">
                              <Button size="sm" onClick={() => handleSaveNote(reading.id)}>
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setEditingNoteId(null); setNoteText(''); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : reading.userNote ? (
                          <div
                            className="cursor-pointer rounded-md bg-blue-50 p-2 text-sm text-blue-800"
                            onClick={() => { setEditingNoteId(reading.id); setNoteText(reading.userNote || ''); }}
                          >
                            {reading.userNote}
                          </div>
                        ) : (
                          <button
                            className="text-sm text-slate-400 hover:text-slate-600"
                            onClick={() => { setEditingNoteId(reading.id); setNoteText(''); }}
                          >
                            + Add note
                          </button>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-center gap-2 border-t pt-4">
                        {status === 'inbox' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(reading.id, 'accepted')}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(reading.id, 'archived')}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </Button>
                          </>
                        )}
                        {status === 'accepted' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(reading.id, 'used')}
                            >
                              Mark as Used
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(reading.id, 'archived')}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </Button>
                          </>
                        )}
                        {status === 'archived' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(reading.id, 'inbox')}
                          >
                            Move to Inbox
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDelete(reading.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
