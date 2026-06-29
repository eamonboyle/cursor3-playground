import type { ContextPersisted } from "./types"

/** Sample agent context with citations and path headers for the demo textarea. */
export const SAMPLE_CONTEXT_TEXT = `You are reviewing a Next.js playground lab. Focus on the parser and tests.

--- lib/context/parse.ts ---
export function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

\`\`\`12:18:lib/context/parse.ts
export function estimateTokens(text: string): number {
  if (!text) return 0
  // Rough GPT-style estimate for mixed code and prose
  return Math.ceil(text.length / 4)
}
\`\`\`

--- components/context/context-app.tsx ---
Paste long chat logs, @-file dumps, or tool output here before sending to an agent.

\`\`\`56:64:components/context/context-app.tsx
  const result = React.useMemo(
    () => parseContextInput(input),
    [input],
  )

  async function copyText(label: string, text: string) {
\`\`\`

Trim the largest sections first when you are near a budget limit.
`

export function defaultContextPersisted(): ContextPersisted {
  return { input: SAMPLE_CONTEXT_TEXT }
}
