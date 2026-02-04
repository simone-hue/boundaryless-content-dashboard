// Newsletter generation prompts for Claude

export interface NewsletterContext {
  masterNarrative: string
  editorialRules: string
  newsletterFormat: string
  buildLogs: string
  readings: string
  theme?: string
}

export const SECTION_PROMPTS = {
  'Thesis Fragment': {
    systemPrompt: `You are Simone Cicero's editorial assistant. Write a thesis fragment for his bi-weekly newsletter about programmable organizations.

Follow the editorial rules provided for tone and vocabulary. Write in first person as Simone.`,

    userPrompt: (ctx: NewsletterContext) => `## MASTER NARRATIVE
${ctx.masterNarrative}

## EDITORIAL RULES
${ctx.editorialRules}

## SELECTED BUILD LOGS
${ctx.buildLogs}

## SELECTED READINGS
${ctx.readings}

${ctx.theme ? `## THEME FOR THIS ISSUE\n${ctx.theme}\n` : ''}

## TASK
Generate a Thesis Fragment (150-250 words) that:
1. Presents one key idea from this week's work
2. Connects to the broader thesis about O2A and programmable organizations
3. Sets up the pattern that follows
4. Uses clear, operator-grade language (no hype)
5. Written in first person as Simone

Output ONLY the thesis fragment text, no preamble or explanation.`,
  },

  'Pattern of the Week': {
    systemPrompt: `You are Simone Cicero's editorial assistant. Write a Pattern of the Week section for his newsletter about programmable organizations.

Follow the editorial rules provided. Use the pattern format: Intent, Forces, Moves, Trade-offs.`,

    userPrompt: (ctx: NewsletterContext) => `## MASTER NARRATIVE
${ctx.masterNarrative}

## EDITORIAL RULES
${ctx.editorialRules}

## NEWSLETTER FORMAT REFERENCE
${ctx.newsletterFormat}

## SELECTED BUILD LOGS (source material)
${ctx.buildLogs}

## SELECTED READINGS (supporting evidence)
${ctx.readings}

## TASK
Generate a Pattern of the Week (400-700 words) with these sections:

**Intent**: What problem does this pattern solve?
**Forces**: What tensions exist?
**Moves**: What are the concrete actions?
**Trade-offs**: What are you giving up?
**Example**: Brief anonymized example from client work or development

Write in a clear, practical style. This is operator-grade content, not marketing.

Output ONLY the pattern content with markdown headers, no preamble.`,
  },

  'Prompt Pack': {
    systemPrompt: `You are Simone Cicero's editorial assistant. Create a Prompt Pack for readers to apply this week's pattern.

Each prompt should be actionable and specific, not generic.`,

    userPrompt: (ctx: NewsletterContext) => `## CONTEXT
${ctx.masterNarrative}

## BUILD LOGS (this week's work)
${ctx.buildLogs}

## READINGS (supporting material)
${ctx.readings}

## TASK
Generate 3 prompts for readers to apply this week's pattern:

1. **DIAGNOSE**: A question/prompt to identify if they have this problem
2. **PROPOSE**: A prompt to generate solution options
3. **IMPLEMENT**: A prompt to create a concrete artifact

Format each prompt as:
### DIAGNOSE
[The prompt text that readers can copy/paste into an AI]

### PROPOSE
[The prompt text]

### IMPLEMENT
[The prompt text]

Make prompts specific and actionable, not generic. They should produce useful outputs.

Output ONLY the three prompts with their headers, no introduction.`,
  },

  'Build Log': {
    systemPrompt: `You are Simone Cicero's editorial assistant. Write a Build Log summary for the newsletter.

This should be a concise summary of what changed in O2A/EMCos development.`,

    userPrompt: (ctx: NewsletterContext) => `## SELECTED BUILD LOGS
${ctx.buildLogs}

## TASK
Generate a Build Log section (150-250 words) that:
1. Summarizes what changed in O2A/EMCos this week
2. Highlights key developments in client work
3. Notes any significant software/tooling updates
4. Written in first person as Simone
5. Practical and concrete, not promotional

Output ONLY the build log text, no preamble.`,
  },

  'CTA': {
    systemPrompt: `You are Simone Cicero's editorial assistant. Write a call-to-action for the newsletter.

Keep it simple, direct, and aligned with Simone's goals of finding design partners and building in public.`,

    userPrompt: (ctx: NewsletterContext) => `## CONTEXT
${ctx.masterNarrative}

## BUILD LOGS
${ctx.buildLogs}

## TASK
Generate a CTA (50-100 words) that:
1. Invites readers to engage (reply with use case, intro, design partner interest)
2. Feels personal, not salesy
3. Connects to the week's theme
4. Written in first person as Simone

Output ONLY the CTA text, no preamble.`,
  },
} as const

export type SectionType = keyof typeof SECTION_PROMPTS
