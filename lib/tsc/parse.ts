import type { TscDiagnostic, TscParseResult, TscSeverity } from "./types"

/** Classic: path(line,col): error TS1234: message */
const CLASSIC_RE =
  /^(.*?)\((\d+),(\d+)\):\s*(error|warning)\s+(TS\d+):\s*(.+)$/i

/** Pretty: path:line:col - error TS1234: message */
const PRETTY_RE =
  /^(.*?):(\d+):(\d+)\s+-\s*(error|warning)\s+(TS\d+):\s*(.+)$/i

/** Global: error TS1234: message */
const GLOBAL_RE = /^(error|warning)\s+(TS\d+):\s*(.+)$/i

const FOUND_RE = /^Found\s+(\d+)\s+error/i
const FILES_RE = /in\s+(\d+)\s+files?\.?\s*$/i

const ANSI_RE = /\x1b\[[0-9;]*m/g

function stripAnsi(line: string): string {
  return line.replace(ANSI_RE, "")
}

function isNodeModulesPath(path: string): boolean {
  return /(?:^|\/)node_modules(?:\/|$)/.test(path)
}

function emptyByCode(): Record<string, number> {
  return {}
}

function pushDiagnostic(
  all: TscDiagnostic[],
  seen: Set<string>,
  unique: TscDiagnostic[],
  diagnostic: TscDiagnostic,
) {
  all.push(diagnostic)
  const key = diagnostic.path
    ? `${diagnostic.path}:${diagnostic.line ?? 0}:${diagnostic.column ?? 0}:${diagnostic.code}`
    : `${diagnostic.code}:${diagnostic.sourceLine}`
  if (!seen.has(key)) {
    seen.add(key)
    unique.push(diagnostic)
  }
}

function parseDiagnosticLine(
  line: string,
  sourceLine: number,
): TscDiagnostic | undefined {
  const trimmed = stripAnsi(line.trimEnd())
  if (!trimmed) {
    return undefined
  }

  const classic = CLASSIC_RE.exec(trimmed)
  if (classic) {
    const path = classic[1]?.trim()
    const lineNum = Number(classic[2])
    const column = Number(classic[3])
    const severity = classic[4]?.toLowerCase() as TscSeverity
    const code = classic[5] ?? ""
    const message = classic[6]?.trim() ?? ""
    if (path && !Number.isNaN(lineNum) && !Number.isNaN(column)) {
      return {
        path,
        line: lineNum,
        column,
        severity,
        code,
        message,
        sourceLine,
        raw: trimmed,
      }
    }
  }

  const pretty = PRETTY_RE.exec(trimmed)
  if (pretty) {
    const path = pretty[1]?.trim()
    const lineNum = Number(pretty[2])
    const column = Number(pretty[3])
    const severity = pretty[4]?.toLowerCase() as TscSeverity
    const code = pretty[5] ?? ""
    const message = pretty[6]?.trim() ?? ""
    if (path && !Number.isNaN(lineNum) && !Number.isNaN(column)) {
      return {
        path,
        line: lineNum,
        column,
        severity,
        code,
        message,
        sourceLine,
        raw: trimmed,
      }
    }
  }

  const global = GLOBAL_RE.exec(trimmed)
  if (global) {
    const severity = global[1]?.toLowerCase() as TscSeverity
    const code = global[2] ?? ""
    const message = global[3]?.trim() ?? ""
    return {
      severity,
      code,
      message,
      sourceLine,
      raw: trimmed,
    }
  }

  return undefined
}

export type ParseTscOptions = {
  hideNodeModules?: boolean
}

export function diagnosticLocation(d: TscDiagnostic): string {
  if (d.path && d.line !== undefined) {
    const col = d.column !== undefined ? `:${d.column}` : ""
    return `${d.path}:${d.line}${col}`
  }
  if (d.path) {
    return d.path
  }
  return `line ${d.sourceLine}`
}

/**
 * Parse pasted TypeScript compiler (`tsc`) output into structured diagnostics.
 */
export function parseTscOutput(
  text: string,
  options: ParseTscOptions = {},
): TscParseResult {
  const hideNodeModules = options.hideNodeModules ?? true
  const warnings: string[] = []
  const diagnostics: TscDiagnostic[] = []
  const unique: TscDiagnostic[] = []
  const seen = new Set<string>()
  const byCode = emptyByCode()
  let errors = 0
  let warningsCount = 0
  let skipped = 0
  let reportedFileCount: number | undefined

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? ""
    const trimmed = stripAnsi(rawLine.trimEnd())

    const found = FOUND_RE.exec(trimmed)
    if (found) {
      const filesMatch = FILES_RE.exec(trimmed)
      if (filesMatch) {
        reportedFileCount = Number(filesMatch[1])
      }
      continue
    }

    const diagnostic = parseDiagnosticLine(rawLine, i + 1)
    if (!diagnostic) {
      continue
    }

    if (diagnostic.path && hideNodeModules && isNodeModulesPath(diagnostic.path)) {
      skipped++
      continue
    }

    pushDiagnostic(diagnostics, seen, unique, diagnostic)
    byCode[diagnostic.code] = (byCode[diagnostic.code] ?? 0) + 1
    if (diagnostic.severity === "error") {
      errors++
    } else {
      warningsCount++
    }
  }

  const filePaths = new Set<string>()
  for (const d of diagnostics) {
    if (d.path) {
      filePaths.add(d.path)
    }
  }

  if (!text.trim()) {
    warnings.push(
      "Paste output from `pnpm typecheck`, `tsc --noEmit`, or your CI type-check step.",
    )
  } else if (diagnostics.length === 0) {
    warnings.push(
      "No TS diagnostics found. Expected lines like `file.ts(10,5): error TS2345: ...` or `file.ts:10:5 - error TS2345: ...`.",
    )
  } else if (skipped > 0) {
    warnings.push(
      `Filtered ${skipped} diagnostic(s) under node_modules. Turn off the switch to include them.`,
    )
  }

  if (
    reportedFileCount !== undefined &&
    filePaths.size > 0 &&
    reportedFileCount !== filePaths.size
  ) {
    warnings.push(
      `Compiler reported ${reportedFileCount} file(s); parsed ${filePaths.size} unique path(s) after filters.`,
    )
  }

  return {
    diagnostics,
    unique,
    summary: { errors, warnings: warningsCount, byCode },
    fileCount: filePaths.size,
    warnings,
  }
}

export function formatTscMarkdown(result: TscParseResult): string {
  if (result.diagnostics.length === 0) {
    return "_No diagnostics found._"
  }

  const { summary } = result
  const codeParts = Object.entries(summary.byCode)
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => `${code}: ${count}`)
  const lines = [
    `**${summary.errors}** error(s), **${summary.warnings}** warning(s) across **${result.fileCount}** file(s)`,
    codeParts.length ? `Codes — ${codeParts.join(", ")}` : "",
    "",
  ].filter(Boolean)

  for (const d of result.diagnostics) {
    const loc = diagnosticLocation(d)
    const sev = d.severity === "error" ? "error" : "warning"
    lines.push(`- **${d.code}** (${sev}) \`${loc}\` — ${d.message}`)
  }

  return lines.join("\n")
}

export function formatTscPaths(result: TscParseResult): string {
  const paths: string[] = []
  const seen = new Set<string>()
  for (const d of result.unique) {
    if (!d.path || d.line === undefined) {
      continue
    }
    const key = `${d.path}:${d.line}`
    if (!seen.has(key)) {
      seen.add(key)
      paths.push(key)
    }
  }
  return paths.join("\n")
}
