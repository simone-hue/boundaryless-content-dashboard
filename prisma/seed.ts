import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Initial sources from BlessStrategy folder
const initialSources = [
  {
    name: 'Master Narrative',
    path: '01-master-narrative.md',
    type: 'file',
    category: 'narrative',
    description: 'Source of truth for thesis, sub-theses, and all content generation',
  },
  {
    name: 'Book TOC',
    path: '05-book-toc.md',
    type: 'file',
    category: 'book',
    description: 'Book table of contents - From Frameworks to Flows',
  },
  {
    name: 'Newsletter Format',
    path: '06-newsletter-format.md',
    type: 'file',
    category: 'format',
    description: 'Newsletter structure template (5 sections)',
  },
  {
    name: 'Editorial Rules',
    path: '07-editorial-rules.md',
    type: 'file',
    category: 'format',
    description: 'Tone, vocabulary, and editorial guardrails',
  },
  {
    name: 'O2A Spec',
    path: 'O2A and Data Model/02-o2a-thin-waist-spec.md',
    type: 'file',
    category: 'spec',
    description: 'O2A thin-waist specification (Node, Offering, Contract, Milestone)',
  },
  {
    name: 'Configuration Patterns',
    path: 'O2A and Data Model/o2a-configuration-patterns-v0.2.md',
    type: 'file',
    category: 'pattern',
    description: 'O2A configuration patterns library',
  },
]

async function main() {
  console.log('Seeding database...')

  // Clear existing sources
  await prisma.source.deleteMany()

  // Create sources
  for (const source of initialSources) {
    await prisma.source.create({
      data: source,
    })
    console.log(`Created source: ${source.name}`)
  }

  console.log('Seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
