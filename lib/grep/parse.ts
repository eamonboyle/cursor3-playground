import type {
  GrepFileGroup,
  GrepHit,
  GrepHitKind,
  GrepParseOptions,
  GrepParseResult,
} from "./types"

/** path:line:optionalColumn:rest */
const RG_LINE_RE = /^(.*?):(\d+)(?::(\d+))?:\s*(.*)$/

/** Context block lines: 12-match or 12-context */
const CONTEXT_LINE_RE = /^(\d+)([-:])(.*)$/

/** Count mode: path:42 with no trailing text after the number */
const COUNT_LINE_RE = /^(.*?):(\d+)$/

const PATH_ONLY_RE = /^(?:\.\/)?[\w@./\-[\]()+\s]+\.\w[\w.]*$/

function isNodeModulesPath(path: string): boolean {
  return /(?:^|\/)node_modules(?:\/|$)/.test(path)
}

function matchesExtension(path: string, extensionFilter?: string): boolean {
  if (!extensionFilter?.trim()) {
    return true
  }
  const normalized = extensionFilter.trim().toLowerCase()
  const withDot = normalized.startsWith(".") ? normalized : `.${normalized}`
  return path.toLowerCase().endsWith(withDot)
}

function fileExtension(path: string): string {
  const base = path.split("/").pop() ?? path
  const dot = base.lastIndexOf(".")
  if (dot <= 0) {
    return "(no ext)"
  }
  return base.slice(dot).toLowerCase()
}

function emptyByExtension(): Record<string, number> {
  return {}
}

function buildHit(
  path: string,
  line: number,
  kind: GrepHitKind,
  text: string,
  sourceLine: number,
  raw: string,
  column?: number,
): GrepHit {
  return {
    path,
    line,
    column,
    kind,
    text,
    sourceLine,
    raw: raw.trimEnd(),
  }
}

function parseInlineLine(
  line: string,
  sourceLine: number,
): GrepHit | "skip" | undefined {
  const trimmed = line.trimEnd()
  if (!trimmed || trimmed === "--") {
    return "skip"
  }

  const rg = RG_LINE_RE.exec(trimmed)
  if (rg) {
    const path = rg[1]?.trim()
    const lineNum = Number(rg[2])
    const column = rg[3] ? Number(rg[3]) : undefined
    const text = rg[4] ?? ""
    if (path && !Number.isNaN(lineNum)) {
      return buildHit(path, lineNum, "match", text, sourceLine, trimmed, column)
    }
  }

  const count = COUNT_LINE_RE.exec(trimmed)
  if (count) {
    const path = count[1]?.trim()
    const total = Number(count[2])
    if (path && !Number.isNaN(total) && PATH_ONLY_RE.test(path)) {
      return buildHit(
        path,
        total,
        "match",
        `(${total} matches)`,
        sourceLine,
        trimmed,
      )
    }
  }

  return undefined
}

function parseContextLine(
  line: string,
  sourceLine: number,
  currentPath?: string,
): GrepHit | "skip" | "path" | undefined {
  const trimmed = line.trimEnd()
  if (!trimmed || trimmed === "--") {
    return "skip"
  }

  if (!trimmed.includes(":") && PATH_ONLY_RE.test(trimmed)) {
    return "path"
  }

  if (!currentPath) {
    return undefined
  }

  const ctx = CONTEXT_LINE_RE.exec(trimmed)
  if (!ctx) {
    return undefined
  }

  const lineNum = Number(ctx[1])
  const separator = ctx[2]
  const text = (ctx[3] ?? "").trimStart()
  if (Number.isNaN(lineNum)) {
    return undefined
  }

  const kind: GrepHitKind = separator === ":" ? "match" : "context"
  return buildHit(currentPath, lineNum, kind, text, sourceLine, trimmed)
}

function groupByFile(hits: GrepHit[]): GrepFileGroup[] {
  const map = new Map<string, GrepHit[]>()
  for (const hit of hits) {
    const list = map.get(hit.path) ?? []
    list.push(hit)
    map.set(hit.path, list)
  }
  return [...map.entries()].map(([path, fileHits]) => ({
    path,
    hits: fileHits,
  }))
}

function applyFilters(
  hits: GrepHit[],
  options: GrepParseOptions,
): { hits: GrepHit[]; skipped: number } {
  let skipped = 0
  const filtered = hits.filter((hit) => {
    if (options.hideNodeModules && isNodeModulesPath(hit.path)) {
      skipped++
      return false
    }
    if (!matchesExtension(hit.path, options.extensionFilter)) {
      skipped++
      return false
    }
    if (options.matchesOnly && hit.kind === "context") {
      skipped++
      return false
    }
    return true
  })
  return { hits: filtered, skipped }
}

export function hitLocation(hit: GrepHit): string {
  const col = hit.column !== undefined ? `:${hit.column}` : ""
  return `${hit.path}:${hit.line}${col}`
}

/**
 * Parse pasted ripgrep or grep -n output into grouped file hits.
 */
export function parseGrepOutput(
  text: string,
  options: GrepParseOptions = {},
): GrepParseResult {
  const warnings: string[] = []
  const rawHits: GrepHit[] = []
  const lines = text.split(/\r?\n/)
  let currentPath: string | undefined
  let usedContextFormat = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const inline = parseInlineLine(line, i + 1)
    if (inline === "skip") {
      currentPath = undefined
      continue
    }
    if (inline) {
      rawHits.push(inline)
      currentPath = inline.path
      continue
    }

    const ctx = parseContextLine(line, i + 1, currentPath)
    if (ctx === "skip") {
      currentPath = undefined
      continue
    }
    if (ctx === "path") {
      currentPath = line.trim()
      usedContextFormat = true
      continue
    }
    if (ctx) {
      rawHits.push(ctx)
      usedContextFormat = true
    }
  }

  const { hits, skipped } = applyFilters(rawHits, options)
  const groups = groupByFile(hits)

  const byExtension = emptyByExtension()
  let matchCount = 0
  let contextCount = 0
  const filePaths = new Set<string>()

  for (const hit of hits) {
    filePaths.add(hit.path)
    byExtension[fileExtension(hit.path)] =
      (byExtension[fileExtension(hit.path)] ?? 0) + 1
    if (hit.kind === "match") {
      matchCount++
    } else {
      contextCount++
    }
  }

  if (!text.trim()) {
    warnings.push(
      "Paste output from `rg -n`, `rg -nC 2`, or `grep -rn` — one hit per line or context blocks.",
    )
  } else if (hits.length === 0) {
    warnings.push(
      "No hits found. Try: rg -n \"pattern\" --glob '!node_modules' or paste path:line:match lines.",
    )
  } else {
    if (skipped > 0) {
      warnings.push(`Filtered ${skipped} hit(s) by current options.`)
    }
    if (usedContextFormat) {
      warnings.push("Parsed ripgrep context blocks (-C) alongside inline path:line hits.")
    }
  }

  return {
    hits,
    groups,
    summary: {
      total: hits.length,
      matchCount,
      contextCount,
      fileCount: filePaths.size,
      byExtension,
    },
    warnings,
  }
}

export function formatGrepMarkdown(result: GrepParseResult): string {
  if (result.hits.length === 0) {
    return "_No hits found._"
  }

  const { summary } = result
  const extParts = Object.entries(summary.byExtension)
    .sort((a, b) => b[1] - a[1])
    .map(([ext, count]) => `${ext}: ${count}`)
  const lines = [
    `**${summary.matchCount}** match(es), **${summary.contextCount}** context line(s) across **${summary.fileCount}** file(s)`,
    extParts.length ? `Extensions — ${extParts.join(", ")}` : "",
    "",
  ].filter(Boolean)

  for (const group of result.groups) {
    lines.push(`### \`${group.path}\` (${group.hits.length})`)
    for (const hit of group.hits) {
      const prefix = hit.kind === "context" ? "ctx" : "hit"
      const snippet = hit.text ? ` — ${hit.text}` : ""
      lines.push(`- (${prefix}) \`${hitLocation(hit)}\`${snippet}`)
    }
    lines.push("")
  }

  return lines.join("\n").trimEnd()
}

export function formatGrepPaths(result: GrepParseResult): string {
  const seen = new Set<string>()
  const paths: string[] = []
  for (const hit of result.hits) {
    if (hit.kind !== "match") {
      continue
    }
    const key = hitLocation(hit)
    if (!seen.has(key)) {
      seen.add(key)
      paths.push(key)
    }
  }
  return paths.join("\n")
}

export function formatGrepFiles(result: GrepParseResult): string {
  const seen = new Set<string>()
  const paths: string[] = []
  for (const hit of result.hits) {
    if (!seen.has(hit.path)) {
      seen.add(hit.path)
      paths.push(hit.path)
    }
  }
  return paths.join("\n")
}
