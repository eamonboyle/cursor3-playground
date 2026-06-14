import type { LocEntry, LocParseOptions, LocParseResult, LocSummary } from "./types"

/** wc -l: optional leading spaces, line count, path (may contain spaces if quoted — we keep simple paths). */
const WC_LINE_RE = /^\s*(\d+)\s+(.+?)\s*$/

/** path<TAB>lines, path,lines, or path: lines */
const PAIR_LINE_RE = /^(.+?)[\t,]\s*(\d+)\s*$/

/** ripgrep --count: path:count */
const RG_COUNT_RE = /^(.+?):(\d+)\s*$/

function isNodeModulesPath(path: string): boolean {
  return /(?:^|\/)node_modules(?:\/|$)/.test(path)
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\/+/, "").trim()
}

function extensionOf(path: string): string {
  const base = path.split("/").pop() ?? path
  const dot = base.lastIndexOf(".")
  if (dot <= 0) {
    return "(no ext)"
  }
  return base.slice(dot).toLowerCase()
}

function topDirOf(path: string): string {
  const parts = path.split("/").filter(Boolean)
  if (parts.length === 0) {
    return "(root)"
  }
  return parts[0] ?? "(root)"
}

function isTotalLine(path: string): boolean {
  const lower = path.toLowerCase()
  return lower === "total" || lower.endsWith("/total")
}

function parseInputLine(
  line: string,
  sourceLine: number,
): LocEntry | undefined {
  const trimmed = line.trimEnd()
  if (!trimmed || trimmed.startsWith("#")) {
    return undefined
  }

  const wc = WC_LINE_RE.exec(trimmed)
  if (wc) {
    const lines = Number(wc[1])
    const path = normalizePath(wc[2] ?? "")
    if (!path || Number.isNaN(lines)) {
      return undefined
    }
    if (isTotalLine(path)) {
      return undefined
    }
    return { path, lines, sourceLine, raw: trimmed }
  }

  const pair = PAIR_LINE_RE.exec(trimmed)
  if (pair) {
    const path = normalizePath(pair[1] ?? "")
    const lines = Number(pair[2])
    if (!path || Number.isNaN(lines)) {
      return undefined
    }
    return { path, lines, sourceLine, raw: trimmed }
  }

  const rg = RG_COUNT_RE.exec(trimmed)
  if (rg) {
    const path = normalizePath(rg[1] ?? "")
    const lines = Number(rg[2])
    if (!path || Number.isNaN(lines)) {
      return undefined
    }
    return { path, lines, sourceLine, raw: trimmed }
  }

  return undefined
}

function buildSummary(entries: LocEntry[]): LocSummary {
  const byExtension: Record<string, number> = {}
  const byTopDir: Record<string, number> = {}
  let totalLines = 0

  for (const entry of entries) {
    totalLines += entry.lines
    const ext = extensionOf(entry.path)
    byExtension[ext] = (byExtension[ext] ?? 0) + entry.lines
    const top = topDirOf(entry.path)
    byTopDir[top] = (byTopDir[top] ?? 0) + entry.lines
  }

  return {
    fileCount: entries.length,
    totalLines,
    byExtension,
    byTopDir,
  }
}

function matchesExtension(path: string, filter: string): boolean {
  const normalized = filter.trim().toLowerCase()
  if (!normalized) {
    return true
  }
  const ext = extensionOf(path)
  const needle = normalized.startsWith(".") ? normalized : `.${normalized}`
  return ext === needle
}

function dedupeEntries(entries: LocEntry[]): LocEntry[] {
  const byPath = new Map<string, LocEntry>()
  for (const entry of entries) {
    const existing = byPath.get(entry.path)
    if (!existing || entry.lines > existing.lines) {
      byPath.set(entry.path, entry)
    }
  }
  return [...byPath.values()].sort((a, b) => b.lines - a.lines)
}

/**
 * Parse pasted wc -l, find -exec wc, cloc-style pairs, or ripgrep --count output.
 */
export function parseLocScan(
  text: string,
  options: LocParseOptions = {},
): LocParseResult {
  const warnings: string[] = []
  const parsed: LocEntry[] = []

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const entry = parseInputLine(lines[i] ?? "", i + 1)
    if (entry) {
      parsed.push(entry)
    }
  }

  let entries = dedupeEntries(parsed)

  if (!text.trim()) {
    warnings.push(
      "Paste wc -l output, path<TAB>lines pairs, or ripgrep --count results.",
    )
  } else if (entries.length === 0) {
    warnings.push(
      "No line counts found. Try: find lib -name '*.ts' -exec wc -l {} +",
    )
  }

  if (options.hideNodeModules !== false) {
    entries = entries.filter((e) => !isNodeModulesPath(e.path))
  }

  if (options.extensionFilter?.trim()) {
    entries = entries.filter((e) =>
      matchesExtension(e.path, options.extensionFilter!),
    )
  }

  const minLines = options.minLines ?? 0
  if (minLines > 0) {
    entries = entries.filter((e) => e.lines >= minLines)
  }

  return {
    entries,
    summary: buildSummary(entries),
    warnings,
  }
}

export function formatLocMarkdown(result: LocParseResult): string {
  if (result.entries.length === 0) {
    return "_No line counts found._"
  }

  const { summary } = result
  const lines = [
    `**${summary.totalLines.toLocaleString()}** lines across **${summary.fileCount}** file(s)`,
    "",
    "### By extension",
  ]

  const extRows = Object.entries(summary.byExtension).sort((a, b) => b[1] - a[1])
  for (const [ext, count] of extRows) {
    lines.push(`- \`${ext}\`: ${count.toLocaleString()} lines`)
  }

  lines.push("", "### Largest files")
  for (const entry of result.entries.slice(0, 20)) {
    lines.push(`- \`${entry.path}\`: ${entry.lines.toLocaleString()} lines`)
  }

  return lines.join("\n")
}

export function formatLocPaths(result: LocParseResult): string {
  return result.entries.map((e) => `${e.path}:${e.lines}`).join("\n")
}

export function formatLocLargestPaths(
  result: LocParseResult,
  limit = 10,
): string {
  return result.entries
    .slice(0, limit)
    .map((e) => e.path)
    .join("\n")
}
