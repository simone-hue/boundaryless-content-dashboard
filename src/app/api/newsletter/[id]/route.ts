import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/newsletter/[id] - Get single newsletter with sections
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const newsletter = await prisma.content.findUnique({
      where: { id },
      include: {
        children: {
          where: { type: 'newsletter_section' },
          orderBy: { sequenceOrder: 'asc' },
        },
        contentSources: {
          include: {
            source: true,
          },
        },
      },
    })

    if (!newsletter) {
      return NextResponse.json(
        { error: 'Newsletter not found' },
        { status: 404 }
      )
    }

    // Parse bodyJson for metadata
    const metadata = newsletter.bodyJson ? JSON.parse(newsletter.bodyJson) : {}

    return NextResponse.json({
      newsletter,
      metadata,
    })
  } catch (error) {
    console.error('Failed to fetch newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletter' },
      { status: 500 }
    )
  }
}

// PATCH /api/newsletter/[id] - Update newsletter
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}

    // Update main newsletter fields
    if (body.title !== undefined) updateData.title = body.title
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === 'published') {
        updateData.publishedAt = new Date()
      }
    }
    if (body.bodyMarkdown !== undefined) updateData.bodyMarkdown = body.bodyMarkdown

    // Update metadata (selectedBuildLogs, selectedReadings, etc.)
    if (body.metadata !== undefined) {
      updateData.bodyJson = JSON.stringify(body.metadata)
    }

    // Update sections if provided
    if (body.sections && Array.isArray(body.sections)) {
      for (const section of body.sections) {
        if (section.id) {
          await prisma.content.update({
            where: { id: section.id },
            data: {
              bodyMarkdown: section.bodyMarkdown,
              status: section.bodyMarkdown ? 'generated' : 'draft',
            },
          })
        }
      }
    }

    const newsletter = await prisma.content.update({
      where: { id },
      data: updateData,
      include: {
        children: {
          where: { type: 'newsletter_section' },
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    })

    return NextResponse.json({ newsletter })
  } catch (error) {
    console.error('Failed to update newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to update newsletter' },
      { status: 500 }
    )
  }
}

// DELETE /api/newsletter/[id] - Delete newsletter
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete children first (sections)
    await prisma.content.deleteMany({
      where: { parentId: id },
    })

    // Delete the newsletter
    await prisma.content.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to delete newsletter' },
      { status: 500 }
    )
  }
}
