'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewNewsletterPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [issueNumber, setIssueNumber] = useState<number | ''>('')
  const [slug, setSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-generate slug from title
  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value))
    }
  }

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          issueNumber: issueNumber || undefined,
          slug: slug || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create newsletter')
      }

      const data = await res.json()
      router.push(`/newsletter/${data.newsletter.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create newsletter')
      setCreating(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        title="New Newsletter"
        description="Create a new newsletter issue"
        actions={
          <Link href="/newsletter">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Newsletter Details</CardTitle>
              <CardDescription>
                Create a new newsletter issue. You&apos;ll be able to add content and generate sections after creation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., From Frameworks to Flows"
                    value={title}
                    onChange={e => handleTitleChange(e.target.value)}
                    disabled={creating}
                  />
                  <p className="text-sm text-slate-500">
                    The main title/theme for this newsletter issue
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueNumber">Issue Number</Label>
                  <Input
                    id="issueNumber"
                    type="number"
                    min="1"
                    placeholder="e.g., 1"
                    value={issueNumber}
                    onChange={e => setIssueNumber(e.target.value ? parseInt(e.target.value) : '')}
                    disabled={creating}
                  />
                  <p className="text-sm text-slate-500">
                    Optional issue number (will be prepended to title)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="e.g., from-frameworks-to-flows"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    disabled={creating}
                  />
                  <p className="text-sm text-slate-500">
                    URL-friendly identifier (auto-generated from title)
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <h4 className="font-medium text-slate-900">What happens next?</h4>
                  <p className="mt-2 text-sm text-slate-600">
                    After creating the newsletter, you&apos;ll be able to:
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                    <li>Select Build Logs and Readings as source material</li>
                    <li>Generate each section (Thesis, Pattern, Prompt Pack, etc.) with AI</li>
                    <li>Edit and refine the generated content</li>
                    <li>Preview and publish the newsletter</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3">
                  <Link href="/newsletter">
                    <Button type="button" variant="outline" disabled={creating}>
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Newsletter
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
