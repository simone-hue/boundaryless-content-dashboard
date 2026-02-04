'use client'

import { useState, useEffect, use } from 'react'
import { Header } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit3,
  RefreshCw,
  FileText,
  Copy,
  Check,
  Download,
} from 'lucide-react'

interface Section {
  id: string
  title: string
  bodyMarkdown: string | null
  sequenceOrder: number
}

interface Newsletter {
  id: string
  title: string
  status: string
  bodyJson: string | null
  children: Section[]
}

export default function NewsletterPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchNewsletter()
  }, [id])

  async function fetchNewsletter() {
    try {
      const res = await fetch(`/api/newsletter/${id}`)
      const data = await res.json()
      setNewsletter(data.newsletter)
    } catch (error) {
      console.error('Failed to fetch newsletter:', error)
    } finally {
      setLoading(false)
    }
  }

  function getFullMarkdown(): string {
    if (!newsletter) return ''

    const sections = newsletter.children
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
      .filter(s => s.bodyMarkdown)
      .map(section => {
        return `## ${section.title}\n\n${section.bodyMarkdown}`
      })

    return `# ${newsletter.title}\n\n${sections.join('\n\n---\n\n')}`
  }

  async function copyToClipboard() {
    const markdown = getFullMarkdown()
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadMarkdown() {
    const markdown = getFullMarkdown()
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${newsletter?.title?.toLowerCase().replace(/\s+/g, '-') || 'newsletter'}.md`
    a.click()
    URL.revokeObjectURL(url)
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

  const completeSections = newsletter.children.filter(s => s.bodyMarkdown).length
  const totalSections = newsletter.children.length

  return (
    <div className="flex h-full flex-col">
      <Header
        title={`Preview: ${newsletter.title}`}
        description={`${completeSections}/${totalSections} sections complete`}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/newsletter/${id}`}>
              <Button variant="outline">
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" onClick={copyToClipboard}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Markdown
                </>
              )}
            </Button>
            <Button variant="outline" onClick={downloadMarkdown}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Link href="/newsletter">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardContent className="p-8">
              {/* Newsletter Title */}
              <h1 className="text-3xl font-bold text-slate-900">
                {newsletter.title}
              </h1>

              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary">{newsletter.status}</Badge>
                <span className="text-sm text-slate-500">
                  {completeSections}/{totalSections} sections
                </span>
              </div>

              {/* Sections */}
              <div className="mt-8 space-y-8">
                {newsletter.children
                  .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                  .map((section, index) => (
                    <div key={section.id}>
                      {index > 0 && <hr className="my-8 border-slate-200" />}

                      <h2 className="text-xl font-semibold text-slate-800">
                        {section.title}
                      </h2>

                      {section.bodyMarkdown ? (
                        <div className="mt-4 prose prose-slate max-w-none">
                          {/* Simple markdown rendering - in production use a proper markdown renderer */}
                          {section.bodyMarkdown.split('\n\n').map((paragraph, i) => {
                            // Handle headers
                            if (paragraph.startsWith('### ')) {
                              return (
                                <h4 key={i} className="text-lg font-semibold mt-6 mb-2">
                                  {paragraph.replace('### ', '')}
                                </h4>
                              )
                            }
                            if (paragraph.startsWith('## ')) {
                              return (
                                <h3 key={i} className="text-xl font-semibold mt-6 mb-2">
                                  {paragraph.replace('## ', '')}
                                </h3>
                              )
                            }
                            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                              return (
                                <p key={i} className="font-semibold mt-4">
                                  {paragraph.replace(/\*\*/g, '')}
                                </p>
                              )
                            }
                            // Handle bold text inline
                            const parts = paragraph.split(/(\*\*.*?\*\*)/g)
                            return (
                              <p key={i} className="mt-4 text-slate-700 leading-relaxed">
                                {parts.map((part, j) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={j}>{part.replace(/\*\*/g, '')}</strong>
                                  }
                                  return part
                                })}
                              </p>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
                          <p className="text-slate-400">
                            No content yet. Generate or write content in the editor.
                          </p>
                          <Link href={`/newsletter/${id}`} className="mt-4 inline-block">
                            <Button variant="outline" size="sm">
                              <Edit3 className="mr-2 h-4 w-4" />
                              Edit Section
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Raw Markdown Preview */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <details>
                <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900">
                  View Raw Markdown
                </summary>
                <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs font-mono text-slate-700 whitespace-pre-wrap">
                  {getFullMarkdown() || 'No content yet.'}
                </pre>
              </details>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
