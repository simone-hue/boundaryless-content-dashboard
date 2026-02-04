import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// CORS headers for bookmarklet requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// GET /api/readings - List readings with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tag = searchParams.get('tag')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (tag) {
      // Search in both aiTags and userTags (JSON arrays stored as strings)
      where.OR = [
        { aiTags: { contains: tag } },
        { userTags: { contains: tag } },
      ]
    }

    const [readings, total] = await Promise.all([
      prisma.reading.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.reading.count({ where }),
    ])

    // Parse JSON fields for response
    const parsedReadings = readings.map(reading => ({
      ...reading,
      aiChapters: reading.aiChapters ? JSON.parse(reading.aiChapters) : [],
      aiTags: reading.aiTags ? JSON.parse(reading.aiTags) : [],
      userTags: reading.userTags ? JSON.parse(reading.userTags) : [],
    }))

    return NextResponse.json({
      readings: parsedReadings,
      total,
      limit,
      offset,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Failed to fetch readings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch readings' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// POST /api/readings - Create new reading (from bookmarklet)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, title, excerpt, description } = body

    if (!url || !title) {
      return NextResponse.json(
        { error: 'URL and title are required' },
        { status: 400 }
      )
    }

    // Check if reading already exists
    const existing = await prisma.reading.findUnique({
      where: { url },
    })

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        status: existing.status,
        reading: existing,
        message: 'Reading already exists',
      }, { headers: corsHeaders })
    }

    // Create new reading
    const reading = await prisma.reading.create({
      data: {
        url,
        title,
        excerpt: excerpt || description || null,
        status: 'inbox',
      },
    })

    // TODO: Trigger AI analysis asynchronously
    // For now, return immediately and let user manually trigger analysis

    return NextResponse.json({
      id: reading.id,
      status: 'inbox',
      reading,
    }, { status: 201, headers: corsHeaders })
  } catch (error) {
    console.error('Failed to create reading:', error)
    return NextResponse.json(
      { error: 'Failed to create reading' },
      { status: 500, headers: corsHeaders }
    )
  }
}
