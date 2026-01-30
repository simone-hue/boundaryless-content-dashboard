'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Clock, RefreshCw, Eye, FolderOpen, BookOpen, Code, Layers } from 'lucide-react'

interface Source {
  id: string
  name: string
  path: string
  type: string
  category: string | null
  description: string | null
  lastHash: string | null
  lastSynced: string | null
  snapshots: { id: string; extractedAt: string }[]
}

const categoryIcons: Record<string, typeof FileText> = {
  narrative: BookOpen,
  spec: Code,
  format: FileText,
  book: BookOpen,
  pattern: Layers,
}

const categoryColors: Record<string, string> = {
  narrative: 'bg-purple-100 text-purple-800',
  spec: 'bg-blue-100 text-blue-800',
  format: 'bg-green-100 text-green-800',
  book: 'bg-amber-100 text-amber-800',
  pattern: 'bg-pink-100 text-pink-800',
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [sourceContent, setSourceContent] = useState<string>('')
  const [loadingContent, setLoadingContent] = useState(false)

  useEffect(() => {
    fetchSources()
  }, [])

  async function fetchSources() {
    try {
      const response = await fetch('/api/sources')
      const data = await response.json()
      setSources(data)
    } catch (error) {
      console.error('Failed to fetch sources:', error)
    } finally {
      setLoading(false)
    }
  }

  async function syncSources() {
    setSyncing(true)
    try {
      const response = await fetch('/api/sources/sync', { method: 'POST' })
      const result = await response.json()
      console.log('Sync result:', result)
      await fetchSources()
    } catch (error) {
      console.error('Failed to sync sources:', error)
    } finally {
      setSyncing(false)
    }
  }

  async function viewSource(source: Source) {
    setSelectedSource(source)
    setLoadingContent(true)
    try {
      // If we have a snapshot, use its content
      if (source.snapshots.length > 0) {
        const response = await fetch(`/api/sources/${source.id}/content`)
        const data = await response.json()
        setSourceContent(data.content || 'No content available')
      } else {
        setSourceContent('Source not synced yet. Click "Sync All" to load content.')
      }
    } catch (error) {
      setSourceContent('Failed to load content')
    } finally {
      setLoadingContent(false)
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
        title="Sources"
        description="Content sources from BlessStrategy folder"
        action={{
          label: syncing ? 'Syncing...' : 'Sync All',
          onClick: syncSources,
          loading: syncing,
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Source List */}
        <div className="w-1/3 overflow-auto border-r border-slate-200 p-4">
          <div className="space-y-3">
            {sources.map((source) => {
              const Icon = categoryIcons[source.category || ''] || FolderOpen
              const colorClass = categoryColors[source.category || ''] || 'bg-slate-100 text-slate-800'

              return (
                <Card
                  key={source.id}
                  className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                    selectedSource?.id === source.id ? 'ring-2 ring-slate-900' : ''
                  }`}
                  onClick={() => viewSource(source)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-500" />
                        <CardTitle className="text-sm">{source.name}</CardTitle>
                      </div>
                      {source.category && (
                        <Badge variant="secondary" className={colorClass}>
                          {source.category}
                        </Badge>
                      )}
                    </div>
                    {source.description && (
                      <CardDescription className="text-xs">
                        {source.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>Synced: {formatDate(source.lastSynced)}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-auto p-4">
          {selectedSource ? (
            <div className="h-full">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedSource.name}</h2>
                  <p className="text-sm text-slate-500">{selectedSource.path}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => viewSource(selectedSource)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {loadingContent ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="h-[calc(100%-4rem)] overflow-auto rounded-lg border border-slate-200 bg-white">
                  <pre className="whitespace-pre-wrap p-4 text-sm text-slate-700">
                    {sourceContent}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-slate-500">
              <Eye className="mb-4 h-12 w-12" />
              <p>Select a source to view its content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
