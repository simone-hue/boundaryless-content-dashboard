import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const entry = await prisma.buildLogEntry.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Build log entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Failed to fetch build log entry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch build log entry' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const entry = await prisma.buildLogEntry.update({
      where: { id },
      data: {
        clientWork: body.clientWork,
        softwareDev: body.softwareDev,
        prototyping: body.prototyping,
        reading: body.reading,
        voiceTranscript: body.voiceTranscript,
        status: body.status,
      },
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Failed to update build log entry:', error)
    return NextResponse.json(
      { error: 'Failed to update build log entry' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.buildLogEntry.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete build log entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete build log entry' },
      { status: 500 }
    )
  }
}
