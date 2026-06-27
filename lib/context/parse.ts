import type {
  ContextBudgetRow,
  ContextBudgetStatus,
  ContextParseOptions,
  ContextParseResult,
  ContextSection,
  ContextParseSummary,
  TokenEstimateMethod,
} from "./types"

const DEFAULT_BUDGET_LIMITS = [8_000, 32_000, 128_000] as const

const CITATION_BLOCK_RE =
  /```(\d+):(\d+):([^\n`]+)\n([\s\S]*?)```/g

const DELIMITER_LINE_RE = /^---\s+(.+?)\s+---\s*$/

const FILE_HEADER_RE = /^(?:File|PATH):\s+(.+?)\s*$/i

type RawChunk = {
  label: string
  content: string
}

function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) {
    return 0
  }
  return trimmed.split(/\s+/).length
}

function countLines(text: string): number {
  if (!text) {
    return 0
  }
  return text.split(/\r?\n/).length
}

export function estimateTokens(
  chars: number,
  words: number,
  method: TokenEstimateMethod,
  charsPerToken = 4,
  wordsPerToken = 0.75,
): number {
  if (method === "words") {
    return Math.ceil(words / wordsPerToken)
  }
  return Math.ceil(chars / charsPerToken)
}

function normalizeLabel(label: string): string {
  return label.trim().replace(/\\/g, "/")
}

function extractCitationChunks(text: string): RawChunk[] {
  const chunks: RawChunk[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  CITATION_BLOCK_RE.lastIndex = 0
  while ((match = CITATION_BLOCK_RE.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index).trim()
    if (before) {
      chunks.push({ label: "(between blocks)", content: before })
    }
    const path = normalizeLabel(match[3] ?? "unknown")
    const content = match[4] ?? ""
    chunks.push({ label: path, content })
    lastIndex = match.index + match[0].length
  }

  const tail = text.slice(lastIndex).trim()
  if (tail) {
    chunks.push({ label: "(trailing)", content: tail })
  }

  return chunks
}

function extractDelimiterChunks(text: string): RawChunk[] {
  const lines = text.split(/\r?\n/)
  const chunks: RawChunk[] = []
  let currentLabel = "(preamble)"
  let buffer: string[] = []

  function flush() {
    const content = buffer.join("\n").trim()
    if (content) {
      chunks.push({ label: currentLabel, content })
    }
    buffer = []
  }

  for (const line of lines) {
    const delim = DELIMITER_LINE_RE.exec(line.trim())
    if (delim) {
      flush()
      currentLabel = normalizeLabel(delim[1] ?? "unknown")
      continue
    }
    const header = FILE_HEADER_RE.exec(line.trim())
    if (header) {
      flush()
      currentLabel = normalizeLabel(header[1] ?? "unknown")
      continue
    }
    buffer.push(line)
  }

  flush()
  return chunks
}

function splitDelimiterContent(text: string, defaultLabel: string): RawChunk[] {
  const delimiterChunks = extractDelimiterChunks(text)
  if (delimiterChunks.length > 0) {
    const onlyPreamble =
      delimiterChunks.length === 1 &&
      delimiterChunks[0]?.label === "(preamble)"
    if (!onlyPreamble) {
      return delimiterChunks
    }
  }
  const content = text.trim()
  if (!content) {
    return []
  }
  return [{ label: defaultLabel, content }]
}

function refineChunks(chunks: RawChunk[]): RawChunk[] {
  const refined: RawChunk[] = []
  for (const chunk of chunks) {
    if (
      chunk.label === "(between blocks)" ||
      chunk.label === "(trailing)" ||
      chunk.label === "(preamble)"
    ) {
      refined.push(...splitDelimiterContent(chunk.content, chunk.label))
      continue
    }
    refined.push(chunk)
  }
  return refined
}

function splitIntoChunks(text: string): RawChunk[] {
  const trimmed = text.trim()
  if (!trimmed) {
    return []
  }

  const citationChunks = extractCitationChunks(trimmed)
  const hasCitationBlocks = citationChunks.some(
    (c) => c.label !== "(between blocks)" && c.label !== "(trailing)",
  )
  if (hasCitationBlocks) {
    return refineChunks(citationChunks)
  }

  const delimiterChunks = extractDelimiterChunks(trimmed)
  if (delimiterChunks.length > 1) {
    return delimiterChunks
  }

  return [{ label: "(entire paste)", content: trimmed }]
}

function budgetStatus(tokens: number, limit: number): ContextBudgetStatus {
  if (tokens > limit) {
    return "over"
  }
  if (tokens > limit * 0.85) {
    return "warn"
  }
  return "ok"
}

function buildBudgets(
  tokens: number,
  limits: readonly number[],
): ContextBudgetRow[] {
  return limits.map((limit) => ({
    label: `${(limit / 1000).toFixed(0)}k`,
    limit,
    status: budgetStatus(tokens, limit),
    headroom: limit - tokens,
  }))
}

function buildSummary(
  sections: ContextSection[],
  tokens: number,
): ContextParseSummary {
  let chars = 0
  let lines = 0
  let words = 0
  let largest: ContextSection | null = null

  for (const section of sections) {
    chars += section.chars
    lines += section.lines
    words += section.words
    if (!largest || section.tokens > largest.tokens) {
      largest = section
    }
  }

  return {
    sectionCount: sections.length,
    chars,
    lines,
    words,
    tokens,
    largestSection: largest?.label ?? null,
  }
}

/**
 * Split pasted agent context into sections and estimate token usage.
 */
export function parseContextInput(
  text: string,
  options: ContextParseOptions = {},
): ContextParseResult {
  const warnings: string[] = []
  const method: TokenEstimateMethod = options.tokenMethod ?? "chars"
  const charsPerToken = options.charsPerToken ?? 4
  const wordsPerToken = options.wordsPerToken ?? 0.75

  const rawChunks = splitIntoChunks(text)
  if (!text.trim()) {
    warnings.push(
      "Paste agent context — Cursor ```start:end:filepath fences, --- path --- delimiters, or plain text.",
    )
  } else if (rawChunks.length === 0) {
    warnings.push("No content to analyze.")
  }

  const sections: ContextSection[] = rawChunks.map((chunk) => {
    const chars = chunk.content.length
    const lines = countLines(chunk.content)
    const words = countWords(chunk.content)
    const tokens = estimateTokens(chars, words, method, charsPerToken, wordsPerToken)
    return {
      label: chunk.label,
      content: chunk.content,
      chars,
      lines,
      words,
      tokens,
      percentOfTotal: 0,
    }
  })

  const totalTokens = sections.reduce((sum, s) => sum + s.tokens, 0)
  for (const section of sections) {
    section.percentOfTotal =
      totalTokens > 0 ? Math.round((section.tokens / totalTokens) * 1000) / 10 : 0
  }

  sections.sort((a, b) => b.tokens - a.tokens)

  if (text.trim() && sections.length === 1 && sections[0]?.label === "(entire paste)") {
    warnings.push(
      "Single block detected. Add ```start:end:filepath fences or --- path --- lines to split by file.",
    )
  } else if (sections.length > 1) {
    warnings.push(
      `Split into ${sections.length} section(s) using citation fences or --- path --- delimiters.`,
    )
  }

  const budgets = buildBudgets(totalTokens, DEFAULT_BUDGET_LIMITS)
  const overBudget = budgets.filter((b) => b.status === "over")
  if (overBudget.length > 0) {
    warnings.push(
      `Exceeds ${overBudget.map((b) => b.label).join(", ")} token budget(s) — trim largest sections first.`,
    )
  }

  return {
    sections,
    summary: buildSummary(sections, totalTokens),
    budgets,
    warnings,
  }
}

export function formatContextMarkdown(result: ContextParseResult): string {
  if (result.sections.length === 0) {
    return "_No context to analyze._"
  }

  const { summary } = result
  const lines = [
    `**~${summary.tokens.toLocaleString()}** estimated tokens across **${summary.sectionCount}** section(s)`,
    `**${summary.chars.toLocaleString()}** chars · **${summary.lines.toLocaleString()}** lines · **${summary.words.toLocaleString()}** words`,
    "",
    "### Sections (largest first)",
  ]

  for (const section of result.sections) {
    lines.push(
      `- \`${section.label}\`: ~${section.tokens.toLocaleString()} tokens (${section.percentOfTotal}%) — ${section.lines} lines`,
    )
  }

  lines.push("", "### Budget headroom")
  for (const row of result.budgets) {
    const sign = row.headroom >= 0 ? "+" : ""
    lines.push(
      `- ${row.label}: ${row.status} (${sign}${row.headroom.toLocaleString()} tokens)`,
    )
  }

  return lines.join("\n")
}

export function formatLargestSectionLabels(
  result: ContextParseResult,
  limit = 5,
): string {
  return result.sections
    .filter((s) => !s.label.startsWith("("))
    .slice(0, limit)
    .map((s) => s.label)
    .join("\n")
}
