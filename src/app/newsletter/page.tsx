'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import {
  Plus,
  RefreshCw,
  FileText,
  Eye,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
} from 'lucide-react'

interface Newsletter {
  id: string
  title: string
  slug: string | null
  status: string
  createdAt: string
  publishedAt: string | null
  bodyJson: string | null
  children: {
    id: string
    title: string
    status: string
    bodyMarkdown: string | null
  }[]
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-800', icon: <Edit3 className="h-3 w-3" /> },
  generated: { label: 'Generated', color: 'bg-blue-100 text-blue-800', icon: <FileText className="h-3 w-3" /> },
  review: { label: 'In Review', color: 'bg-amber-100 text-amber-800', icon: <Clock className="h-3 w-3" /> },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3 w-3" /> },
  scheduled: { label: 'Scheduled', color: 'bg-purple-100 text-purple-800', icon: <Calendar className="h-3 w-3" /> },
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle2 className="h-3 w-3" /> },
}

export default function NewsletterPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchNewsletters()
  }, [])

  async function fetchNewsletters() {
    try {
      setLoading(true)
      const res = await fetch('/api/newsletter')
      const data = await res.json()
      setNewsletters(data.newsletters || [])
    } catch (error) {
      console.error('Failed to fetch newsletters:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteNewsletter(id: string) {
    if (!confirm('Are you sure you want to delete this newsletter?')) return

    try {
      await fetch(`/api/newsletter/${id}`, { method: 'DELETE' })
      fetchNewsletters()
    } catch (error) {
      console.error('Failed to delete newsletter:', error)
    }
  }

  function getFilteredNewsletters() {
    if (activeTab === 'all') return newsletters
    return newsletters.filter(n => n.status === activeTab)
  }

  function getSectionsComplete(newsletter: Newsletter) {
    const total = newsletter.children?.length || 0
    const complete = newsletter.children?.filter(c => c.bodyMarkdown && c.bodyMarkdown.length > 0).length || 0
    return { complete, total }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const filteredNewsletters = getFilteredNewsletters()

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Newsletter"
        description="Create and manage your bi-weekly newsletters"
        actions={
          <Link href="/newsletter/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Newsletter
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-6 flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">
                All ({newsletters.length})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Draft ({newsletters.filter(n => n.status === 'draft').length})
              </TabsTrigger>
              <TabsTrigger value="review">
                Review ({newsletters.filter(n => n.status === 'review').length})
              </TabsTrigger>
              <TabsTrigger value="published">
                Published ({newsletters.filter(n => n.status === 'published').length})
              </TabsTrigger>
            </TabsList>

            <Button variant="outline" size="sm" onClick={fetchNewsletters} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : filteredNewsletters.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-slate-300" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">No newsletters yet</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Create your first newsletter to get started.
                  </p>
                  <Link href="/newsletter/new" className="mt-4">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Newsletter
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNewsletters.map(newsletter => {
                  const { complete, total } = getSectionsComplete(newsletter)
                  const config = statusConfig[newsletter.status] || statusConfig.draft

                  return (
                    <Card key={newsletter.id} className="transition-colors hover:bg-slate-50">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-slate-400" />
                              <h3 className="text-lg font-semibold text-slate-900">
                                {newsletter.title}
                              </h3>
                              <Badge className={config.color}>
                                {config.icon}
                                <span className="ml-1">{config.label}</span>
                              </Badge>
                            </div>

                            <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Created: {formatDate(newsletter.createdAt)}
                              </span>
                              {newsletter.publishedAt && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  Published: {formatDate(newsletter.publishedAt)}
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <div className="h-2 w-32 rounded-full bg-slate-200">
                                <div
                                  className="h-2 rounded-full bg-blue-500 transition-all"
                                  style={{ width: `${total > 0 ? (complete / total) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-sm text-slate-500">
                                {complete}/{total} sections complete
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link href={`/newsletter/${newsletter.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                            </Link>
                            <Link href={`/newsletter/${newsletter.id}/preview`}>
                              <Button variant="outline" size="sm">
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => deleteNewsletter(newsletter.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
