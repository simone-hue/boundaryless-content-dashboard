import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ReadingAnalysis {
  relevance: string
  chapters: string[]
  tags: string[]
  angle: string | null
}

export async function analyzeReading(
  title: string,
  url: string,
  content: string,
  masterNarrative: string,
  bookToc: string,
  patternsSum: string
): Promise<ReadingAnalysis> {
  const systemPrompt = `You are the editorial assistant for Simone Cicero, founder of Boundaryless.
Your task is to analyze articles and determine their relevance to Simone's thesis about programmable organizations and the O2A (Offering to Agreement) framework.

Always respond in valid JSON format.`

  const userPrompt = `## CONTEXT - Main Thesis
${masterNarrative}

## CONTEXT - Book Structure
${bookToc}

## CONTEXT - O2A Patterns Summary
${patternsSum}

## NEW ARTICLE
Title: ${title}
URL: ${url}
Content: ${content}

## GENERATE (in JSON):
{
  "relevance": "2-3 sentences on how this article connects to Simone's thesis",
  "chapters": ["Chapter X: Title", "Chapter Y: Title"],
  "tags": ["tag1", "tag2", "tag3"],
  "angle": "1 sentence: potential angle for using this in a newsletter"
}

If the article is NOT relevant to the thesis, respond:
{
  "relevance": "NOT_RELEVANT: [brief explanation]",
  "chapters": [],
  "tags": [],
  "angle": null
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    })

    // Extract text content
    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const analysis = JSON.parse(jsonMatch[0]) as ReadingAnalysis
    return analysis
  } catch (error) {
    console.error('Claude analysis failed:', error)
    throw error
  }
}

export { anthropic }
