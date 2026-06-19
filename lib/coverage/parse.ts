import type {
  CoverageFile,
  CoverageParseOptions,
  CoverageParseResult,
  CoverageParseSummary,
} from "./types"

const TABLE_ROW_RE = /^\|(.+)\|$/

const SUMMARY_PATHS = new Set(
  ["all files", "total", "summary"].map((s) => s.toLowerCase()),
)

function splitTableCells(line: string): string[] | undefined {
  if (!line.includes("|")) {
    return undefined
  }

  let cells = line.split("|").map((c) => c.trim())
  if (cells[0] === "") {
    cells = cells.slice(1)
  }
  if (cells.at(-1) === "") {
    cells = cells.slice(0, -1)
  }

  return cells.length >= 5 ? cells : undefined
}

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

function matchesExtension(path: string, filter: string): boolean {
  const normalized = filter.trim().toLowerCase()
  if (!normalized) {
    return true
  }
  const ext = extensionOf(path)
  const needle = normalized.startsWith(".") ? normalized : `.${normalized}`
  return ext === needle
}

function parsePctCell(cell: string): number | null {
  const trimmed = cell.trim()
  if (!trimmed || trimmed === "-" || trimmed === "n/a") {
    return null
  }
  const num = Number(trimmed.replace(/%$/, ""))
  return Number.isNaN(num) ? null : num
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.every((cell) => /^[-\s|]+$/.test(cell))
}

function isHeaderRow(cells: string[]): boolean {
  const joined = cells.join(" ").toLowerCase()
  return joined.includes("% stmts") || joined.includes("% lines")
}

function parseTableRow(
  line: string,
  sourceLine: number,
): CoverageFile | undefined {
  const wrapped = TABLE_ROW_RE.exec(line.trimEnd())
  const cells = wrapped
    ? wrapped[1]!.split("|").map((c) => c.trim())
    : splitTableCells(line.trimEnd())

  if (!cells || cells.length < 5 || isSeparatorRow(cells) || isHeaderRow(cells)) {
    return undefined
  }

  const path = normalizePath(cells[0] ?? "")
  if (!path || SUMMARY_PATHS.has(path.toLowerCase())) {
    return undefined
  }

  const uncoveredLines = cells[5] ?? ""

  return {
    path,
    statements: parsePctCell(cells[1] ?? ""),
    branches: parsePctCell(cells[2] ?? ""),
    functions: parsePctCell(cells[3] ?? ""),
    lines: parsePctCell(cells[4] ?? ""),
    uncoveredLines: uncoveredLines.trim(),
    sourceLine,
    raw: line.trimEnd(),
  }
}

/** Compact lines: `path: 45.2% lines` or `path  45.2%` */
const COMPACT_LINE_RE =
  /^(.+?)\s*:?\s*([\d.]+)%\s*(?:lines?|stmts?|statements?)?\s*$/i

function parseCompactLine(
  line: string,
  sourceLine: number,
): CoverageFile | undefined {
  const trimmed = line.trimEnd()
  if (!trimmed || trimmed.startsWith("#")) {
    return undefined
  }

  const match = COMPACT_LINE_RE.exec(trimmed)
  if (!match) {
    return undefined
  }

  const path = normalizePath(match[1] ?? "")
  const pct = Number(match[2])
  if (!path || Number.isNaN(pct) || SUMMARY_PATHS.has(path.toLowerCase())) {
    return undefined
  }

  return {
    path,
    statements: null,
    branches: null,
    functions: null,
    lines: pct,
    uncoveredLines: "",
    sourceLine,
    raw: trimmed,
  }
}

function buildSummary(
  files: CoverageFile[],
  maxLinesPct?: number,
): CoverageParseSummary {
  const withLines = files.filter((f) => f.lines !== null)
  const avgLines =
    withLines.length > 0
      ? withLines.reduce((sum, f) => sum + (f.lines ?? 0), 0) / withLines.length
      : null

  const threshold = maxLinesPct ?? 100
  const belowThreshold = files.filter(
    (f) => f.lines !== null && f.lines <= threshold,
  ).length

  return {
    fileCount: files.length,
    avgLines: avgLines !== null ? Math.round(avgLines * 100) / 100 : null,
    belowThreshold,
  }
}

function sortFiles(files: CoverageFile[]): CoverageFile[] {
  return [...files].sort((a, b) => {
    const aLines = a.lines ?? 101
    const bLines = b.lines ?? 101
    if (aLines !== bLines) {
      return aLines - bLines
    }
    return a.path.localeCompare(b.path)
  })
}

/**
 * Parse pasted Istanbul / Vitest / Jest / c8 text coverage tables or compact lines.
 */
export function parseCoverageScan(
  text: string,
  options: CoverageParseOptions = {},
): CoverageParseResult {
  const warnings: string[] = []
  const parsed: CoverageFile[] = []

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const tableRow = parseTableRow(line, i + 1)
    if (tableRow) {
      parsed.push(tableRow)
      continue
    }
    const compact = parseCompactLine(line, i + 1)
    if (compact) {
      parsed.push(compact)
    }
  }

  let files = sortFiles(parsed)

  if (!text.trim()) {
    warnings.push(
      "Paste Istanbul-style coverage text (Vitest, Jest, or c8) with file rows and % columns.",
    )
  } else if (files.length === 0) {
    warnings.push(
      "No coverage rows found. Run tests with coverage enabled, e.g. vitest run --coverage or jest --coverage.",
    )
  }

  if (options.hideNodeModules !== false) {
    files = files.filter((f) => !isNodeModulesPath(f.path))
  }

  if (options.extensionFilter?.trim()) {
    files = files.filter((f) =>
      matchesExtension(f.path, options.extensionFilter!),
    )
  }

  if (options.maxLinesPct !== undefined) {
    files = files.filter(
      (f) => f.lines === null || f.lines <= options.maxLinesPct!,
    )
  }

  return {
    files,
    summary: buildSummary(files, options.maxLinesPct),
    warnings,
  }
}

export function formatCoverageMarkdown(result: CoverageParseResult): string {
  if (result.files.length === 0) {
    return "_No coverage rows found._"
  }

  const { summary } = result
  const avg =
    summary.avgLines !== null ? `${summary.avgLines}%` : "—"
  const lines = [
    `**${summary.fileCount}** file(s) — avg lines coverage **${avg}**`,
    "",
    "### Lowest coverage",
  ]

  for (const file of result.files.slice(0, 20)) {
    const pct = file.lines !== null ? `${file.lines}%` : "—"
    const uncovered = file.uncoveredLines
      ? ` (uncovered: ${file.uncoveredLines})`
      : ""
    lines.push(`- \`${file.path}\`: **${pct}** lines${uncovered}`)
  }

  return lines.join("\n")
}

export function formatCoveragePaths(result: CoverageParseResult): string {
  return result.files.map((f) => f.path).join("\n")
}

export function formatCoverageUncovered(result: CoverageParseResult): string {
  return result.files
    .filter((f) => f.uncoveredLines)
    .map((f) => `${f.path}: ${f.uncoveredLines}`)
    .join("\n")
}
