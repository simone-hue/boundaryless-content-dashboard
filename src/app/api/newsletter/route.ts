import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/newsletter - List all newsletters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {
      type: 'newsletter',
    }

    if (status) {
      where.status = status
    }

    const [newsletters, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          children: {
            where: { type: 'newsletter_section' },
            orderBy: { sequenceOrder: 'asc' },
          },
        },
      }),
      prisma.content.count({ where }),
    ])

    return NextResponse.json({
      newsletters,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Failed to fetch newsletters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletters' },
      { status: 500 }
    )
  }
}

// POST /api/newsletter - Create new newsletter
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, issueNumber } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Create newsletter with 5 sections
    const newsletter = await prisma.content.create({
      data: {
        type: 'newsletter',
        title: issueNumber ? `Issue #${issueNumber}: ${title}` : title,
        slug,
        status: 'draft',
        bodyJson: JSON.stringify({
          issueNumber: issueNumber || 1,
          selectedBuildLogs: [],
          selectedReadings: [],
        }),
        children: {
          create: [
            { type: 'newsletter_section', title: 'Thesis Fragment', sequenceOrder: 1, status: 'draft' },
            { type: 'newsletter_section', title: 'Pattern of the Week', sequenceOrder: 2, status: 'draft' },
            { type: 'newsletter_section', title: 'Prompt Pack', sequenceOrder: 3, status: 'draft' },
            { type: 'newsletter_section', title: 'Build Log', sequenceOrder: 4, status: 'draft' },
            { type: 'newsletter_section', title: 'CTA', sequenceOrder: 5, status: 'draft' },
          ],
        },
      },
      include: {
        children: {
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    })

    return NextResponse.json({
      id: newsletter.id,
      newsletter,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to create newsletter' },
      { status: 500 }
    )
  }
}
