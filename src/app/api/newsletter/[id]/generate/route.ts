import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { anthropic } from '@/lib/claude'
import { SECTION_PROMPTS, type SectionType, type NewsletterContext } from '@/lib/prompts/newsletter'
import fs from 'fs/promises'
import path from 'path'

// POST /api/newsletter/[id]/generate - Generate content for a section
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { sectionId, selectedBuildLogs = [], selectedReadings = [] } = body

    // Get newsletter and section
    const newsletter = await prisma.content.findUnique({
      where: { id },
      include: {
        children: true,
      },
    })

    if (!newsletter) {
      return NextResponse.json(
        { error: 'Newsletter not found' },
        { status: 404 }
      )
    }

    const section = newsletter.children.find(c => c.id === sectionId)
    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    // Get section type from title
    const sectionType = section.title as SectionType
    const prompts = SECTION_PROMPTS[sectionType]

    if (!prompts) {
      return NextResponse.json(
        { error: `Unknown section type: ${section.title}` },
        { status: 400 }
      )
    }

    // Load context from BlessStrategy files
    const blessPath = process.env.BLESS_STRATEGY_PATH || 'C:/Users/simon/OneDrive/BlessStrategy'

    let masterNarrative = ''
    let editorialRules = ''
    let newsletterFormat = ''

    try {
      masterNarrative = await fs.readFile(
        path.join(blessPath, '01-master-narrative.md'),
        'utf-8'
      )
    } catch {
      masterNarrative = 'Master narrative not available.'
    }

    try {
      editorialRules = await fs.readFile(
        path.join(blessPath, '07-editorial-rules.md'),
        'utf-8'
      )
    } catch {
      editorialRules = 'Editorial rules not available.'
    }

    try {
      newsletterFormat = await fs.readFile(
        path.join(blessPath, '06-newsletter-format.md'),
        'utf-8'
      )
    } catch {
      newsletterFormat = 'Newsletter format not available.'
    }

    // Get build logs content
    let buildLogsContent = ''
    if (selectedBuildLogs.length > 0) {
      const buildLogs = await prisma.buildLogEntry.findMany({
        where: { id: { in: selectedBuildLogs } },
      })
      buildLogsContent = buildLogs.map(log => `
### Week of ${log.weekStart}
**Client Work:** ${log.clientWork || 'N/A'}
**Software Development:** ${log.softwareDev || 'N/A'}
**Prototyping:** ${log.prototyping || 'N/A'}
**Reading:** ${log.reading || 'N/A'}
`).join('\n')
    } else {
      buildLogsContent = 'No build logs selected.'
    }

    // Get readings content
    let readingsContent = ''
    if (selectedReadings.length > 0) {
      const readings = await prisma.reading.findMany({
        where: { id: { in: selectedReadings } },
      })
      readingsContent = readings.map(r => `
### ${r.title}
URL: ${r.url}
${r.aiRelevance ? `Relevance: ${r.aiRelevance}` : ''}
${r.aiAngle ? `Angle: ${r.aiAngle}` : ''}
${r.excerpt ? `Excerpt: ${r.excerpt}` : ''}
`).join('\n')
    } else {
      readingsContent = 'No readings selected.'
    }

    // Build context
    const context: NewsletterContext = {
      masterNarrative,
      editorialRules,
      newsletterFormat,
      buildLogs: buildLogsContent,
      readings: readingsContent,
    }

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      system: prompts.systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompts.userPrompt(context),
        },
      ],
    })

    // Extract text content
    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      )
    }

    const generatedContent = textContent.text

    // Update section with generated content
    await prisma.content.update({
      where: { id: sectionId },
      data: {
        bodyMarkdown: generatedContent,
        status: 'generated',
      },
    })

    return NextResponse.json({
      content: generatedContent,
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
    })
  } catch (error) {
    console.error('Failed to generate content:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate content' },
      { status: 500 }
    )
  }
}
