import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get the latest snapshot for this source
    const snapshot = await prisma.sourceSnapshot.findFirst({
      where: { sourceId: id },
      orderBy: { extractedAt: 'desc' },
    })

    if (!snapshot) {
      return NextResponse.json(
        { content: null, message: 'No content synced yet' },
        { status: 200 }
      )
    }

    return NextResponse.json({
      content: snapshot.content,
      extractedAt: snapshot.extractedAt,
      contentHash: snapshot.contentHash,
    })
  } catch (error) {
    console.error('Failed to fetch source content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch source content' },
      { status: 500 }
    )
  }
}
