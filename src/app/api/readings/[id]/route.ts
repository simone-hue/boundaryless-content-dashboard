import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/readings/[id] - Get single reading
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const reading = await prisma.reading.findUnique({
      where: { id },
    })

    if (!reading) {
      return NextResponse.json(
        { error: 'Reading not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const parsedReading = {
      ...reading,
      aiChapters: reading.aiChapters ? JSON.parse(reading.aiChapters) : [],
      aiTags: reading.aiTags ? JSON.parse(reading.aiTags) : [],
      userTags: reading.userTags ? JSON.parse(reading.userTags) : [],
    }

    return NextResponse.json(parsedReading)
  } catch (error) {
    console.error('Failed to fetch reading:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading' },
      { status: 500 }
    )
  }
}

// PATCH /api/readings/[id] - Update reading
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}

    // Status update
    if (body.status) {
      updateData.status = body.status
      if (body.status === 'accepted' && !body.acceptedAt) {
        updateData.acceptedAt = new Date()
      }
    }

    // User note
    if (body.userNote !== undefined) {
      updateData.userNote = body.userNote
    }

    // User tags (convert array to JSON string)
    if (body.userTags !== undefined) {
      updateData.userTags = JSON.stringify(body.userTags)
    }

    // Used in content
    if (body.usedInContentId !== undefined) {
      updateData.usedInContentId = body.usedInContentId
    }

    const reading = await prisma.reading.update({
      where: { id },
      data: updateData,
    })

    // Parse JSON fields for response
    const parsedReading = {
      ...reading,
      aiChapters: reading.aiChapters ? JSON.parse(reading.aiChapters) : [],
      aiTags: reading.aiTags ? JSON.parse(reading.aiTags) : [],
      userTags: reading.userTags ? JSON.parse(reading.userTags) : [],
    }

    return NextResponse.json(parsedReading)
  } catch (error) {
    console.error('Failed to update reading:', error)
    return NextResponse.json(
      { error: 'Failed to update reading' },
      { status: 500 }
    )
  }
}

// DELETE /api/readings/[id] - Delete reading
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.reading.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete reading:', error)
    return NextResponse.json(
      { error: 'Failed to delete reading' },
      { status: 500 }
    )
  }
}
