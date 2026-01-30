import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { readFile } from 'fs/promises'
import { createHash } from 'crypto'
import path from 'path'

const BLESS_STRATEGY_PATH = process.env.BLESS_STRATEGY_PATH || ''

function computeHash(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

export async function POST() {
  try {
    const sources = await prisma.source.findMany({
      where: { type: 'file', watchEnabled: true },
    })

    const results = []

    for (const source of sources) {
      try {
        const fullPath = path.join(BLESS_STRATEGY_PATH, source.path)
        const content = await readFile(fullPath, 'utf-8')
        const contentHash = computeHash(content)

        // Check if content changed
        if (source.lastHash !== contentHash) {
          // Create new snapshot
          await prisma.sourceSnapshot.create({
            data: {
              sourceId: source.id,
              content,
              contentHash,
            },
          })

          // Update source
          await prisma.source.update({
            where: { id: source.id },
            data: {
              lastHash: contentHash,
              lastSynced: new Date(),
            },
          })

          results.push({
            id: source.id,
            name: source.name,
            status: 'updated',
          })
        } else {
          // Just update lastSynced
          await prisma.source.update({
            where: { id: source.id },
            data: { lastSynced: new Date() },
          })

          results.push({
            id: source.id,
            name: source.name,
            status: 'unchanged',
          })
        }
      } catch (error) {
        console.error(`Failed to sync source ${source.name}:`, error)
        results.push({
          id: source.id,
          name: source.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      synced: results.filter((r) => r.status === 'updated').length,
      unchanged: results.filter((r) => r.status === 'unchanged').length,
      errors: results.filter((r) => r.status === 'error').length,
      results,
    })
  } catch (error) {
    console.error('Failed to sync sources:', error)
    return NextResponse.json(
      { error: 'Failed to sync sources' },
      { status: 500 }
    )
  }
}
