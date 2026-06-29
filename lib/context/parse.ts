import type {
  ContextBudget,
  ContextBudgetStatus,
  ContextParseResult,
  ContextSection,
  ContextSectionKind,
} from "./types"

const CONTEXT_BUDGETS: ContextBudget[] = [
  { id: "8k", label: "8k", limit: 8_000 },
  { id: "32k", label: "32k", limit: 32_000 },
  { id: "128k", label: "128k", limit: 128_000 },
]

const CITATION_FENCE_RE = /```(\d+):(\d+):([^\n`]+)\n([\s\S]*?)```/g

const PATH_HEADER_LINE_RE = /^---\s+(.+?)\s+---\s*$/

/** Rough token estimate (~4 characters per token for mixed code and prose). */
export function estimateTokens(text: string): number {
  if (!text) {
    return 0
  }
  return Math.ceil(text.length / 4)
}

function countLines(text: string): number {
  if (!text) {
    return 0
  }
  return text.split(/\r?\n/).length
}

function makeSection(
  kind: ContextSectionKind,
  title: string,
  content: string,
  index: number,
): ContextSection {
  const trimmed = content.trimEnd()
  return {
    id: `${kind}-${index}`,
    kind,
    title,
    content: trimmed,
    chars: trimmed.length,
    lines: countLines(trimmed),
    tokens: estimateTokens(trimmed),
  }
}

type FenceSpan = {
  start: number
  end: number
  title: string
  content: string
}

function findCitationFences(text: string): FenceSpan[] {
  const fences: FenceSpan[] = []
  const re = new RegExp(CITATION_FENCE_RE.source, "g")
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    fences.push({
      start: match.index,
      end: match.index + match[0].length,
      title: (match[3] ?? "").trim(),
      content: match[0],
    })
  }
  return fences
}

function splitByCitationFences(text: string): ContextSection[] {
  const fences = findCitationFences(text)
  if (fences.length === 0) {
    return []
  }

  const sections: ContextSection[] = []
  let cursor = 0
  let index = 0

  for (const fence of fences) {
    if (fence.start > cursor) {
      const between = text.slice(cursor, fence.start).trim()
      if (between) {
        sections.push(
          makeSection("plain", `Block ${index + 1}`, between, index++),
        )
      }
    }
    sections.push(makeSection("citation", fence.title, fence.content, index++))
    cursor = fence.end
  }

  const tail = text.slice(cursor).trim()
  if (tail) {
    sections.push(makeSection("plain", "Trailing text", tail, index))
  }

  return sections
}

function splitByPathHeaders(text: string): ContextSection[] {
  const lines = text.split(/\r?\n/)
  const sections: ContextSection[] = []
  let currentTitle = "Introduction"
  let currentLines: string[] = []
  let index = 0
  let sawHeader = false

  for (const line of lines) {
    const headerMatch = PATH_HEADER_LINE_RE.exec(line)
    if (headerMatch) {
      sawHeader = true
      const chunk = currentLines.join("\n").trim()
      if (chunk || sections.length > 0) {
        sections.push(
          makeSection("path-header", currentTitle, chunk || "", index++),
        )
      }
      currentTitle = (headerMatch[1] ?? "").trim() || "Untitled"
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }

  const finalChunk = currentLines.join("\n").trim()
  if (sawHeader) {
    sections.push(
      makeSection("path-header", currentTitle, finalChunk || "", index),
    )
    return sections.filter((section) => section.content.length > 0 || section.kind === "path-header")
  }

  return []
}

function splitContextSections(text: string): ContextSection[] {
  const byCitations = splitByCitationFences(text)
  if (byCitations.length > 0) {
    return byCitations
  }

  const byHeaders = splitByPathHeaders(text)
  if (byHeaders.length > 1) {
    return byHeaders
  }

  const trimmed = text.trim()
  if (!trimmed) {
    return []
  }

  return [makeSection("plain", "Full paste", trimmed, 0)]
}

function analyzeBudgets(totalTokens: number): ContextBudgetStatus[] {
  return CONTEXT_BUDGETS.map((budget) => {
    const fits = totalTokens <= budget.limit
    const overBy = fits ? 0 : totalTokens - budget.limit
    const fillPercent = Math.min(100, (totalTokens / budget.limit) * 100)
    return {
      budget,
      totalTokens,
      fits,
      overBy,
      fillPercent,
    }
  })
}

/**
 * Split pasted agent context into sections and estimate token budgets.
 */
export function parseContextInput(text: string): ContextParseResult {
  const warnings: string[] = []
  const sections = splitContextSections(text)
  const ranked = [...sections].sort((a, b) => b.tokens - a.tokens)

  const totalChars = sections.reduce((sum, section) => sum + section.chars, 0)
  const totalLines = sections.reduce((sum, section) => sum + section.lines, 0)
  const totalTokens = sections.reduce((sum, section) => sum + section.tokens, 0)
  const budgets = analyzeBudgets(totalTokens)

  if (!text.trim()) {
    warnings.push(
      "Paste agent context — chat logs, @-file dumps, citation fences, or --- path --- sections.",
    )
  } else if (sections.length === 0) {
    warnings.push("No sections detected in the pasted text.")
  } else if (sections.length === 1 && sections[0]?.kind === "plain") {
    warnings.push(
      "Single block detected. Add ```start:end:filepath citations or --- path --- headers to split sections.",
    )
  }

  const tightest = budgets.find((status) => !status.fits)
  if (tightest) {
    warnings.push(
      `Over the ${tightest.budget.label} budget by ~${tightest.overBy.toLocaleString()} token(s). Trim the largest sections first.`,
    )
  }

  return {
    sections,
    ranked,
    totalChars,
    totalLines,
    totalTokens,
    budgets,
    warnings,
  }
}

export function formatContextMarkdown(result: ContextParseResult): string {
  if (result.sections.length === 0) {
    return "_No context sections found._"
  }

  const budgetLine = result.budgets
    .map(
      (status) =>
        `${status.budget.label}: ${status.fits ? "fits" : `over by ~${status.overBy.toLocaleString()}`}`,
    )
    .join(" · ")

  const lines = [
    `**~${result.totalTokens.toLocaleString()}** estimated token(s) across **${result.sections.length}** section(s)`,
    `Characters: ${result.totalChars.toLocaleString()} · Lines: ${result.totalLines.toLocaleString()}`,
    `Budgets — ${budgetLine}`,
    "",
    "### Sections (largest first)",
  ]

  for (const section of result.ranked) {
    lines.push(
      `- **${section.title}** (${section.kind}) — ~${section.tokens.toLocaleString()} tokens, ${section.lines} line(s)`,
    )
  }

  return lines.join("\n")
}

export function formatContextSectionTitles(result: ContextParseResult): string {
  return result.ranked.map((section) => section.title).join("\n")
}

export function sectionsWithinBudget(
  ranked: ContextSection[],
  limit: number,
): { included: ContextSection[]; tokens: number; remaining: number } {
  const included: ContextSection[] = []
  let tokens = 0

  for (const section of ranked) {
    if (tokens + section.tokens <= limit) {
      included.push(section)
      tokens += section.tokens
    }
  }

  return {
    included,
    tokens,
    remaining: Math.max(0, limit - tokens),
  }
}
