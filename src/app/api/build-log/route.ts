import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const entries = await prisma.buildLogEntry.findMany({
      orderBy: { weekStart: 'desc' },
    })
    return NextResponse.json(entries)
  } catch (error) {
    console.error('Failed to fetch build log entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch build log entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { weekStart } = body

    // Calculate week end (Sunday)
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    // Check if entry already exists
    const existing = await prisma.buildLogEntry.findUnique({
      where: { weekStart: start },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Build log entry for this week already exists', entry: existing },
        { status: 409 }
      )
    }

    const entry = await prisma.buildLogEntry.create({
      data: {
        weekStart: start,
        weekEnd: end,
        status: 'draft',
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Failed to create build log entry:', error)
    return NextResponse.json(
      { error: 'Failed to create build log entry' },
      { status: 500 }
    )
  }
}
