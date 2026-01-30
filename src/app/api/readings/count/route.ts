import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/readings/count - Get counts by status
export async function GET() {
  try {
    const [inbox, accepted, archived, used, total] = await Promise.all([
      prisma.reading.count({ where: { status: 'inbox' } }),
      prisma.reading.count({ where: { status: 'accepted' } }),
      prisma.reading.count({ where: { status: 'archived' } }),
      prisma.reading.count({ where: { status: 'used' } }),
      prisma.reading.count(),
    ])

    return NextResponse.json({
      inbox,
      accepted,
      archived,
      used,
      total,
    })
  } catch (error) {
    console.error('Failed to count readings:', error)
    return NextResponse.json(
      { error: 'Failed to count readings' },
      { status: 500 }
    )
  }
}
