import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { name: 'asc' },
      include: {
        snapshots: {
          orderBy: { extractedAt: 'desc' },
          take: 1,
        },
      },
    })
    return NextResponse.json(sources)
  } catch (error) {
    console.error('Failed to fetch sources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    )
  }
}
