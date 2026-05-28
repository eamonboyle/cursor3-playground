import type { TodoMarker, TodoParseResult, TodoTag } from "./types"

export const TODO_TAGS: readonly TodoTag[] = [
  "TODO",
  "FIXME",
  "HACK",
  "XXX",
  "BUG",
] as const

const TAG_IN_LINE_RE =
  /\b(TODO|FIXME|HACK|XXX|BUG)\b\s*:?\s*-?\s*(.*)$/i

/** Ripgrep / grep -n style: path:line:optionalColumn:rest */
const RG_LINE_RE = /^(.*?):(\d+)(?::(\d+))?:\s*(.*)$/

function emptyByTag(): Record<TodoTag, number> {
  return { TODO: 0, FIXME: 0, HACK: 0, XXX: 0, BUG: 0 }
}

function isTodoTag(value: string): value is TodoTag {
  return (TODO_TAGS as readonly string[]).includes(value.toUpperCase())
}

function extractMarker(
  content: string,
  sourceLine: number,
  raw: string,
  path?: string,
  line?: number,
  column?: number,
): TodoMarker | undefined {
  const match = TAG_IN_LINE_RE.exec(content)
  if (!match) {
    return undefined
  }
  const tagRaw = match[1]
  if (!tagRaw || !isTodoTag(tagRaw)) {
    return undefined
  }
  const tag = tagRaw.toUpperCase() as TodoTag
  const message = (match[2] ?? "").trim()
  return {
    path,
    line,
    column,
    tag,
    message,
    sourceLine,
    raw: raw.trimEnd(),
  }
}

function parseInputLine(
  line: string,
  sourceLine: number,
): TodoMarker | undefined {
  const trimmed = line.trimEnd()
  if (!trimmed) {
    return undefined
  }

  const rg = RG_LINE_RE.exec(trimmed)
  if (rg) {
    const path = rg[1]?.trim()
    const lineNum = Number(rg[2])
    const column = rg[3] ? Number(rg[3]) : undefined
    const content = rg[4] ?? ""
    if (path && !Number.isNaN(lineNum)) {
      return extractMarker(
        content,
        sourceLine,
        trimmed,
        path,
        lineNum,
        column,
      )
    }
  }

  return extractMarker(trimmed, sourceLine, trimmed)
}

export function markerLocation(marker: TodoMarker): string {
  if (marker.path && marker.line !== undefined) {
    const col =
      marker.column !== undefined ? `:${marker.column}` : ""
    return `${marker.path}:${marker.line}${col}`
  }
  if (marker.path) {
    return marker.path
  }
  if (marker.line !== undefined) {
    return `line ${marker.line}`
  }
  return `input line ${marker.sourceLine}`
}

/**
 * Scan pasted ripgrep output or raw source lines for TODO-style markers.
 */
export function parseTodoScan(text: string): TodoParseResult {
  const warnings: string[] = []
  const markers: TodoMarker[] = []
  const byTag = emptyByTag()

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const marker = parseInputLine(lines[i] ?? "", i + 1)
    if (marker) {
      markers.push(marker)
      byTag[marker.tag]++
    }
  }

  if (!text.trim()) {
    warnings.push("Paste ripgrep output or lines containing TODO, FIXME, HACK, XXX, or BUG.")
  } else if (markers.length === 0) {
    warnings.push(
      "No markers found. Try: rg -n \"TODO|FIXME|HACK|XXX|BUG\" --glob '!node_modules'",
    )
  }

  return {
    markers,
    summary: { total: markers.length, byTag },
    warnings,
  }
}

export function formatTodoScanMarkdown(result: TodoParseResult): string {
  if (result.markers.length === 0) {
    return "_No markers found._"
  }

  const { summary } = result
  const tagParts = TODO_TAGS.filter((t) => summary.byTag[t] > 0).map(
    (t) => `${t}: ${summary.byTag[t]}`,
  )
  const lines = [
    `**${summary.total}** marker(s) — ${tagParts.join(", ")}`,
    "",
  ]

  for (const m of result.markers) {
    const loc = markerLocation(m)
    const msg = m.message ? ` — ${m.message}` : ""
    lines.push(`- **${m.tag}** \`${loc}\`${msg}`)
  }

  return lines.join("\n")
}

export function formatTodoScanPaths(result: TodoParseResult): string {
  const seen = new Set<string>()
  const paths: string[] = []
  for (const m of result.markers) {
    if (!m.path) {
      continue
    }
    const key = m.line !== undefined ? `${m.path}:${m.line}` : m.path
    if (!seen.has(key)) {
      seen.add(key)
      paths.push(key)
    }
  }
  return paths.join("\n")
}
