'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Eye,
  RefreshCw,
  Sparkles,
  FileText,
  CheckCircle2,
  BookOpen,
  Lightbulb,
  MessageSquare,
  Target,
  Loader2,
} from 'lucide-react'

interface Section {
  id: string
  title: string
  bodyMarkdown: string | null
  status: string
  sequenceOrder: number
}

interface Newsletter {
  id: string
  title: string
  slug: string | null
  status: string
  bodyMarkdown: string | null
  bodyJson: string | null
  children: Section[]
}

interface Reading {
  id: string
  title: string
  url: string
  aiRelevance: string | null
  aiAngle: string | null
  status: string
}

interface BuildLog {
  id: string
  weekStart: string
  clientWork: string | null
  softwareDev: string | null
  status: string
}

interface Metadata {
  issueNumber?: number
  selectedBuildLogs?: string[]
  selectedReadings?: string[]
}

const sectionIcons: Record<string, React.ReactNode> = {
  'Thesis Fragment': <Lightbulb className="h-4 w-4" />,
  'Pattern of the Week': <Target className="h-4 w-4" />,
  'Prompt Pack': <MessageSquare className="h-4 w-4" />,
  'Build Log': <FileText className="h-4 w-4" />,
  'CTA': <CheckCircle2 className="h-4 w-4" />,
}

const sectionDescriptions: Record<string, { words: string; description: string }> = {
  'Thesis Fragment': { words: '150-250', description: 'One key idea from this week, connected to your book thesis' },
  'Pattern of the Week': { words: '400-700', description: 'Intent, forces, moves, trade-offs from client work' },
  'Prompt Pack': { words: '3 prompts', description: 'Diagnose → Propose → Implement for readers' },
  'Build Log': { words: '150-250', description: 'What changed in O2A/EMCos this week' },
  'CTA': { words: '50-100', description: 'Call-to-action for readers' },
}

export default function NewsletterEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [newsletter, setNewsletter] = useState<Newsletter | null>(null)
  const [metadata, setMetadata] = useState<Metadata>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)

  const [readings, setReadings] = useState<Reading[]>([])
  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([])

  const [activeSection, setActiveSection] = useState<string>('')
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const [editedTitle, setEditedTitle] = useState('')

  useEffect(() => {
    fetchNewsletter()
    fetchSources()
  }, [id])

  async function fetchNewsletter() {
    try {
      const res = await fetch(`/api/newsletter/${id}`)
      const data = await res.json()

      if (data.newsletter) {
        setNewsletter(data.newsletter)
        setEditedTitle(data.newsletter.title)
        setMetadata(data.metadata || {})

        // Initialize edited content from sections
        const content: Record<string, string> = {}
        data.newsletter.children?.forEach((section: Section) => {
          content[section.id] = section.bodyMarkdown || ''
        })
        setEditedContent(content)

        // Set first section as active
        if (data.newsletter.children?.length > 0 && !activeSection) {
          setActiveSection(data.newsletter.children[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch newsletter:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSources() {
    try {
      // Fetch accepted readings
      const readingsRes = await fetch('/api/readings?status=accepted&limit=20')
      const readingsData = await readingsRes.json()
      setReadings(readingsData.readings || [])

      // Fetch build logs
      const buildLogsRes = await fetch('/api/build-log')
      const buildLogsData = await buildLogsRes.json()
      setBuildLogs(buildLogsData || [])
    } catch (error) {
      console.error('Failed to fetch sources:', error)
    }
  }

  async function handleSave() {
    if (!newsletter) return

    setSaving(true)
    try {
      const sections = newsletter.children.map(section => ({
        id: section.id,
        bodyMarkdown: editedContent[section.id] || '',
      }))

      await fetch(`/api/newsletter/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle,
          sections,
          metadata: {
            ...metadata,
            selectedBuildLogs: metadata.selectedBuildLogs || [],
            selectedReadings: metadata.selectedReadings || [],
          },
        }),
      })

      // Refresh data
      fetchNewsletter()
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerate(sectionId: string) {
    if (!newsletter) return

    setGenerating(sectionId)
    try {
      const res = await fetch(`/api/newsletter/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId,
          selectedBuildLogs: metadata.selectedBuildLogs || [],
          selectedReadings: metadata.selectedReadings || [],
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setEditedContent(prev => ({
          ...prev,
          [sectionId]: data.content,
        }))
      } else {
        const error = await res.json()
        alert(`Generation failed: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to generate:', error)
      alert('Failed to generate content')
    } finally {
      setGenerating(null)
    }
  }

  function toggleBuildLog(logId: string) {
    setMetadata(prev => {
      const selected = prev.selectedBuildLogs || []
      if (selected.includes(logId)) {
        return { ...prev, selectedBuildLogs: selected.filter(id => id !== logId) }
      } else {
        return { ...prev, selectedBuildLogs: [...selected, logId] }
      }
    })
  }

  function toggleReading(readingId: string) {
    setMetadata(prev => {
      const selected = prev.selectedReadings || []
      if (selected.includes(readingId)) {
        return { ...prev, selectedReadings: selected.filter(id => id !== readingId) }
      } else {
        return { ...prev, selectedReadings: [...selected, readingId] }
      }
    })
  }

  function countWords(text: string) {
    return text.trim().split(/\s+/).filter(Boolean).length
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!newsletter) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <FileText className="h-12 w-12 text-slate-300" />
        <h2 className="mt-4 text-lg font-medium">Newsletter not found</h2>
        <Link href="/newsletter" className="mt-4">
          <Button variant="outline">Back to list</Button>
        </Link>
      </div>
    )
  }

  const currentSection = newsletter.children.find(s => s.id === activeSection)

  return (
    <div className="flex h-full flex-col">
      <Header
        title={editedTitle}
        description={`Status: ${newsletter.status}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/newsletter">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <Link href={`/newsletter/${id}/preview`}>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </Link>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </>
              )}
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Sources */}
          <div className="space-y-6">
            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Newsletter Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Title</label>
                  <Input
                    value={editedTitle}
                    onChange={e => setEditedTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Issue #</label>
                  <Input
                    type="number"
                    value={metadata.issueNumber || ''}
                    onChange={e => setMetadata(prev => ({ ...prev, issueNumber: parseInt(e.target.value) || undefined }))}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Build Logs Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  Build Logs
                  {(metadata.selectedBuildLogs?.length || 0) > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {metadata.selectedBuildLogs?.length} selected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {buildLogs.length === 0 ? (
                  <p className="text-sm text-slate-500">No build logs available</p>
                ) : (
                  <div className="space-y-2">
                    {buildLogs.slice(0, 5).map(log => (
                      <label
                        key={log.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border p-2 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={metadata.selectedBuildLogs?.includes(log.id) || false}
                          onChange={() => toggleBuildLog(log.id)}
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm">Week of {log.weekStart}</span>
                        {log.status && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {log.status}
                          </Badge>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Readings Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4" />
                  Readings
                  {(metadata.selectedReadings?.length || 0) > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {metadata.selectedReadings?.length} selected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {readings.length === 0 ? (
                  <p className="text-sm text-slate-500">No accepted readings available</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {readings.map(reading => (
                      <label
                        key={reading.id}
                        className="flex cursor-pointer items-start gap-2 rounded-lg border p-2 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={metadata.selectedReadings?.includes(reading.id) || false}
                          onChange={() => toggleReading(reading.id)}
                          className="mt-1 rounded border-slate-300"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{reading.title}</p>
                          {reading.aiAngle && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{reading.aiAngle}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Section Editor */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-0">
                <Tabs value={activeSection} onValueChange={setActiveSection}>
                  <div className="border-b px-4">
                    <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-2">
                      {newsletter.children.map(section => {
                        const hasContent = (editedContent[section.id]?.length || 0) > 0
                        return (
                          <TabsTrigger
                            key={section.id}
                            value={section.id}
                            className="flex items-center gap-2 data-[state=active]:bg-slate-100"
                          >
                            {sectionIcons[section.title] || <FileText className="h-4 w-4" />}
                            <span className="hidden sm:inline">{section.title.replace(' of the Week', '')}</span>
                            {hasContent && (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            )}
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>
                  </div>

                  {newsletter.children.map(section => {
                    const info = sectionDescriptions[section.title]
                    const content = editedContent[section.id] || ''
                    const wordCount = countWords(content)

                    return (
                      <TabsContent key={section.id} value={section.id} className="p-4 mt-0">
                        <div className="space-y-4">
                          {/* Section Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                {sectionIcons[section.title]}
                                {section.title}
                              </h3>
                              {info && (
                                <p className="text-sm text-slate-500 mt-1">
                                  {info.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerate(section.id)}
                              disabled={generating === section.id}
                            >
                              {generating === section.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Generate with AI
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Editor */}
                          <textarea
                            value={content}
                            onChange={e => setEditedContent(prev => ({ ...prev, [section.id]: e.target.value }))}
                            placeholder={`Write your ${section.title.toLowerCase()} here...`}
                            className="w-full h-80 rounded-lg border border-slate-200 p-4 text-sm font-mono focus:border-slate-400 focus:outline-none focus:ring-0 resize-none"
                          />

                          {/* Word Count */}
                          <div className="flex items-center justify-between text-sm text-slate-500">
                            <span>
                              {info && `Target: ${info.words} words`}
                            </span>
                            <span className={wordCount > 0 ? 'text-slate-700' : ''}>
                              {wordCount} words
                            </span>
                          </div>
                        </div>
                      </TabsContent>
                    )
                  })}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
