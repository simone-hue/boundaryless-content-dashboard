import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { analyzeReading } from '@/lib/claude'

// POST /api/readings/[id]/analyze - Trigger AI analysis
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Get the reading
    const reading = await prisma.reading.findUnique({
      where: { id },
    })

    if (!reading) {
      return NextResponse.json(
        { error: 'Reading not found' },
        { status: 404 }
      )
    }

    // Get source content for context
    const sources = await prisma.source.findMany({
      where: {
        category: { in: ['narrative', 'book', 'pattern'] },
      },
      include: {
        snapshots: {
          orderBy: { extractedAt: 'desc' },
          take: 1,
        },
      },
    })

    // Build context from sources
    let masterNarrative = ''
    let bookToc = ''
    let patternsSum = ''

    for (const source of sources) {
      const content = source.snapshots[0]?.content || ''
      if (source.name.includes('Master Narrative')) {
        masterNarrative = content.substring(0, 3000) // Limit size
      } else if (source.name.includes('Book TOC')) {
        bookToc = content.substring(0, 2000)
      } else if (source.category === 'pattern') {
        patternsSum += content.substring(0, 1500) + '\n---\n'
      }
    }

    // Use excerpt or content for analysis
    const contentToAnalyze = reading.content || reading.excerpt || reading.title

    // Run Claude analysis
    const analysis = await analyzeReading(
      reading.title,
      reading.url,
      contentToAnalyze,
      masterNarrative || 'No master narrative loaded',
      bookToc || 'No book TOC loaded',
      patternsSum || 'No patterns loaded'
    )

    // Update reading with AI suggestions
    const updatedReading = await prisma.reading.update({
      where: { id },
      data: {
        aiRelevance: analysis.relevance,
        aiChapters: JSON.stringify(analysis.chapters),
        aiTags: JSON.stringify(analysis.tags),
        aiAngle: analysis.angle,
        processedAt: new Date(),
      },
    })

    // Parse JSON fields for response
    const parsedReading = {
      ...updatedReading,
      aiChapters: analysis.chapters,
      aiTags: analysis.tags,
      userTags: updatedReading.userTags ? JSON.parse(updatedReading.userTags) : [],
    }

    return NextResponse.json({
      success: true,
      reading: parsedReading,
    })
  } catch (error) {
    console.error('Failed to analyze reading:', error)
    return NextResponse.json(
      { error: 'Failed to analyze reading' },
      { status: 500 }
    )
  }
}
