import type {
  ContextBudget,
  ContextParseResult,
  ContextSection,
  ContextSectionKind,
} from "./types"

export const CONTEXT_BUDGET_LIMITS = [8_000, 32_000, 128_000] as const

const CITATION_FENCE_RE =
  /```(\d+):(\d+):([^\n`]+)\n([\s\S]*?)```/g

const PATH_HEADER_RE = /^---\s*(.+?)\s*---\s*$/gm

/** Rough token estimate for mixed code and prose (~4 chars per token). */
export function estimateTokens(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) {
    return 0
  }
  return Math.max(1, Math.ceil(trimmed.length / 4))
}

function lineNumberAt(text: string, index: number): number {
  let line = 1
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === "\n") {
      line++
    }
  }
  return line
}

type SectionMarker = {
  start: number
  end: number
  kind: ContextSectionKind
  label: string
  text: string
}

function overlapsCitation(
  start: number,
  end: number,
  citations: SectionMarker[],
): boolean {
  return citations.some((c) => start < c.end && end > c.start)
}

function findCitationMarkers(text: string): SectionMarker[] {
  const markers: SectionMarker[] = []
  const re = new RegExp(CITATION_FENCE_RE.source, "g")
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const filepath = (match[3] ?? "").trim()
    markers.push({
      start: match.index,
      end: match.index + match[0].length,
      kind: "citation",
      label: filepath || "citation",
      text: match[0],
    })
  }
  return markers
}

function findPathHeaderMarkers(
  text: string,
  citations: SectionMarker[],
): SectionMarker[] {
  const headers: { start: number; end: number; label: string }[] = []
  const re = new RegExp(PATH_HEADER_RE.source, "gm")
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const headerStart = match.index
    const headerEnd = match.index + match[0].length
    if (overlapsCitation(headerStart, headerEnd, citations)) {
      continue
    }
    headers.push({
      start: headerStart,
      end: headerEnd,
      label: (match[1] ?? "").trim() || "file",
    })
  }

  return headers.map((header) => {
    const nextStarts = [
      ...citations.map((c) => c.start).filter((p) => p > header.start),
      ...headers.map((h) => h.start).filter((p) => p > header.start),
    ]
    const contentEnd =
      nextStarts.length > 0 ? Math.min(...nextStarts) : text.length
    const headerLine = text.slice(header.start, header.end)
    const body = text.slice(header.end, contentEnd).replace(/^\n/, "")
    const sectionText = `${headerLine}\n${body}`.replace(/\s+$/, "")

    return {
      start: header.start,
      end: contentEnd,
      kind: "path-header" as const,
      label: header.label,
      text: sectionText,
    }
  })
}

function makeChunkSection(
  text: string,
  sourceStartLine: number,
  index: number,
): ContextSection {
  const trimmed = text.trim()
  return {
    kind: "chunk",
    label: `Section ${index}`,
    text: trimmed,
    charCount: trimmed.length,
    tokenEstimate: estimateTokens(trimmed),
    sourceStartLine,
  }
}

function makeMarkerSection(marker: SectionMarker, text: string): ContextSection {
  return {
    kind: marker.kind,
    label: marker.label,
    text: marker.text.trim(),
    charCount: marker.text.trim().length,
    tokenEstimate: estimateTokens(marker.text),
    sourceStartLine: lineNumberAt(text, marker.start),
  }
}

/**
 * Split pasted agent context into sections by citation fences, path headers,
 * or blank-line chunks when no structure is detected.
 */
export function splitContextSections(text: string): ContextSection[] {
  if (!text.trim()) {
    return []
  }

  const citations = findCitationMarkers(text)
  const pathHeaders = findPathHeaderMarkers(text, citations)
  const structured = [...citations, ...pathHeaders].sort(
    (a, b) => a.start - b.start,
  )

  if (structured.length > 0) {
    const sections: ContextSection[] = []
    let cursor = 0
    let chunkIndex = 1

    for (const marker of structured) {
      if (marker.start > cursor) {
        const gap = text.slice(cursor, marker.start)
        if (gap.trim()) {
          sections.push(
            makeChunkSection(gap, lineNumberAt(text, cursor), chunkIndex++),
          )
        }
      }
      sections.push(makeMarkerSection(marker, text))
      cursor = marker.end
    }

    if (cursor < text.length) {
      const tail = text.slice(cursor)
      if (tail.trim()) {
        sections.push(
          makeChunkSection(tail, lineNumberAt(text, cursor), chunkIndex),
        )
      }
    }

    return sections
  }

  const parts = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  if (parts.length <= 1) {
    return [makeChunkSection(text, 1, 1)]
  }

  const sections: ContextSection[] = []
  let searchFrom = 0
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!
    const idx = text.indexOf(part, searchFrom)
    const sourceStartLine = idx >= 0 ? lineNumberAt(text, idx) : i + 1
    if (idx >= 0) {
      searchFrom = idx + part.length
    }
    sections.push(makeChunkSection(part, sourceStartLine, i + 1))
  }
  return sections
}

function buildBudgets(totalTokens: number): ContextBudget[] {
  return CONTEXT_BUDGET_LIMITS.map((limit) => {
    const percentUsed = Math.round((totalTokens / limit) * 1000) / 10
    return {
      limit,
      label: limit >= 1000 ? `${limit / 1000}k` : String(limit),
      percentUsed,
      exceeded: totalTokens > limit,
    }
  })
}

export function parseContextSize(text: string): ContextParseResult {
  const warnings: string[] = []
  const sections = splitContextSections(text)
  const totalChars = sections.reduce((sum, s) => sum + s.charCount, 0)
  const totalTokens = sections.reduce((sum, s) => sum + s.tokenEstimate, 0)

  if (!text.trim()) {
    warnings.push(
      "Paste agent context — citation fences, --- path --- headers, or plain prose.",
    )
  } else if (sections.length === 0) {
    warnings.push("No sections detected in the pasted input.")
  } else if (sections.every((s) => s.kind === "chunk") && sections.length === 1) {
    warnings.push(
      "Treated as one block. Add ```start:end:filepath``` fences or --- path --- headers to split sections.",
    )
  }

  return {
    sections,
    summary: {
      totalChars,
      totalTokens,
      sectionCount: sections.length,
    },
    budgets: buildBudgets(totalTokens),
    warnings,
  }
}

export function sortSectionsByTokens(
  sections: ContextSection[],
): ContextSection[] {
  return [...sections].sort((a, b) => b.tokenEstimate - a.tokenEstimate)
}

export function formatContextMarkdown(result: ContextParseResult): string {
  const { summary, budgets } = result
  if (summary.sectionCount === 0) {
    return "_No context sections._"
  }

  const budgetParts = budgets.map(
    (b) => `${b.label}: ${b.percentUsed}%${b.exceeded ? " (over)" : ""}`,
  )
  const lines = [
    `**~${summary.totalTokens.toLocaleString()}** tokens across **${summary.sectionCount}** section(s) — ${budgetParts.join(", ")}`,
    "",
  ]

  for (const section of sortSectionsByTokens(result.sections)) {
    const kind =
      section.kind === "citation"
        ? "citation"
        : section.kind === "path-header"
          ? "file"
          : "chunk"
    lines.push(
      `- **${section.label}** (${kind}) — ~${section.tokenEstimate.toLocaleString()} tokens, line ${section.sourceStartLine}`,
    )
  }

  return lines.join("\n")
}

export function formatContextLargestLabels(
  result: ContextParseResult,
  limit = 5,
): string {
  return sortSectionsByTokens(result.sections)
    .slice(0, limit)
    .map((s) => `${s.label} (~${s.tokenEstimate} tokens)`)
    .join("\n")
}
