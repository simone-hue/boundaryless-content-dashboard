'use client'

import { useState } from 'react'
import { Header } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bookmark,
  Key,
  FolderOpen,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'

export default function SettingsPage() {
  const [copied, setCopied] = useState(false)

  // Bookmarklet code - minified for manual bookmark creation
  const bookmarkletCode = `javascript:(function(){var d={url:location.href,title:document.title,excerpt:getSelection().toString().slice(0,500),description:(document.querySelector('meta[name="description"]')||{}).content||''};fetch('http://localhost:3000/api/readings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(r=>r.json()).then(x=>alert('✅ '+(x.reading?.title||x.message))).catch(e=>alert('❌ '+e))})();`

  async function copyBookmarklet() {
    await navigator.clipboard.writeText(bookmarkletCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Settings"
        description="Configure your content dashboard"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Bookmarklet Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Save Reading Bookmarklet
              </CardTitle>
              <CardDescription>
                Use this bookmarklet to save articles while browsing the web
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-4">
                <h4 className="font-medium text-amber-800">How to install (3 steps):</h4>
                <ol className="mt-2 list-inside list-decimal space-y-2 text-sm text-amber-700">
                  <li>
                    <strong>Copy the code</strong> using the button below
                  </li>
                  <li>
                    <strong>Create a new bookmark</strong> in your browser:
                    <ul className="ml-6 mt-1 list-disc text-amber-600">
                      <li>Chrome/Edge: Right-click bookmarks bar → "Add page..."</li>
                      <li>Firefox: Ctrl+Shift+B → Right-click → "New Bookmark"</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Paste the code</strong> in the URL field, name it "Save to Boundaryless"
                  </li>
                </ol>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={copyBookmarklet} className="w-full">
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied to clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Bookmarklet Code
                    </>
                  )}
                </Button>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <h4 className="text-sm font-medium text-slate-700">How to use:</h4>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-600">
                  <li>Navigate to any article you want to save</li>
                  <li>Optionally select text you find interesting</li>
                  <li>Click the "Save to Boundaryless" bookmark</li>
                  <li>You&apos;ll see an alert confirming the save</li>
                </ol>
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                  View bookmarklet code
                </summary>
                <pre className="mt-2 overflow-x-auto rounded-md bg-slate-100 p-3 text-xs break-all whitespace-pre-wrap">
                  {bookmarkletCode}
                </pre>
              </details>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                <strong>Note:</strong> Make sure the dashboard is running on{' '}
                <code className="rounded bg-blue-100 px-1">localhost:3000</code> when you use the bookmarklet.
              </div>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Configure external API integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h4 className="font-medium">Anthropic API Key</h4>
                  <p className="text-sm text-slate-500">Required for AI-powered reading analysis</p>
                </div>
                <Badge variant="secondary" className="bg-slate-100">
                  Set via .env file
                </Badge>
              </div>

              <div className="rounded-lg bg-slate-50 p-4 text-sm">
                <p className="font-medium">To configure:</p>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-slate-600">
                  <li>Open <code className="rounded bg-slate-200 px-1">.env</code> in the project root</li>
                  <li>Add your API key: <code className="rounded bg-slate-200 px-1">ANTHROPIC_API_KEY=sk-ant-...</code></li>
                  <li>Restart the development server</li>
                </ol>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  Get your API key from Anthropic Console
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* BlessStrategy Path */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                BlessStrategy Folder
              </CardTitle>
              <CardDescription>
                Path to your content strategy source files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h4 className="font-medium">BLESS_STRATEGY_PATH</h4>
                  <p className="font-mono text-sm text-slate-500">
                    {process.env.NEXT_PUBLIC_BLESS_STRATEGY_PATH || 'C:/Users/simon/OneDrive/BlessStrategy'}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Configured
                </Badge>
              </div>

              <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                <p>This folder should contain:</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>01-master-narrative.md</li>
                  <li>05-book-toc.md</li>
                  <li>06-newsletter-format.md</li>
                  <li>07-editorial-rules.md</li>
                  <li>O2A and Data Model/*.md</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-slate-600">
                <p><strong>Boundaryless Content Dashboard</strong></p>
                <p>Version 0.2.1 - Readings System</p>
                <p className="mt-4">
                  A tool for sustainable content production, integrating your thesis,
                  curated readings, and AI-assisted content generation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
