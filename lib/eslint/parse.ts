import type {
  EslintDiagnostic,
  EslintParseResult,
  EslintSeverity,
} from "./types"

/** Stylish: indented line:col  severity  message  rule */
const STYLISH_PREFIX_RE = /^\s+(\d+):(\d+)\s+(error|warning)\s+(.+)$/i

/** Unix: path:line:col: message. [Severity/rule] */
const UNIX_RE =
  /^(.*?):(\d+):(\d+):\s*(.+?)\.\s*\[(Error|Warning)\/([\w@/.\-]+)\]\s*$/i

/** Compact: path: line N, col M, Severity - message. (rule) */
const COMPACT_RE =
  /^(.*?):\s*line\s+(\d+),\s*col\s+(\d+),\s*(Error|Warning)\s+-\s+(.+?)\.\s*\(([\w@/.\-]+)\)\s*$/i

const PROBLEMS_RE = /^✖\s+(\d+)\s+problems?\s*(?:\((\d+)\s+errors?,\s*(\d+)\s+warnings?\))?/i
const FILE_PATH_RE = /^(?:\.\/)?[\w@./\-[\]()+\s]+\.\w[\w.]*$/

const ANSI_RE = /\x1b\[[0-9;]*m/g

function stripAnsi(line: string): string {
  return line.replace(ANSI_RE, "")
}

function isNodeModulesPath(path: string): boolean {
  return /(?:^|\/)node_modules(?:\/|$)/.test(path)
}

function emptyByRule(): Record<string, number> {
  return {}
}

function pushDiagnostic(
  all: EslintDiagnostic[],
  seen: Set<string>,
  unique: EslintDiagnostic[],
  diagnostic: EslintDiagnostic,
) {
  all.push(diagnostic)
  const key = diagnostic.path
    ? `${diagnostic.path}:${diagnostic.line ?? 0}:${diagnostic.column ?? 0}:${diagnostic.rule}`
    : `${diagnostic.rule}:${diagnostic.sourceLine}`
  if (!seen.has(key)) {
    seen.add(key)
    unique.push(diagnostic)
  }
}

function parseRuleAndMessage(rest: string): { message: string; rule: string } {
  const ruleMatch = /^(.+?)\s{2,}([\w@][\w@/.\-]*)\s*$/.exec(rest.trim())
  if (ruleMatch) {
    return {
      message: ruleMatch[1]?.trim() ?? "",
      rule: ruleMatch[2] ?? "",
    }
  }
  return { message: rest.trim(), rule: "" }
}

function parseStylishLine(
  line: string,
  sourceLine: number,
  currentPath?: string,
): EslintDiagnostic | undefined {
  const trimmed = stripAnsi(line.trimEnd())
  const match = STYLISH_PREFIX_RE.exec(trimmed)
  if (!match) {
    return undefined
  }

  const lineNum = Number(match[1])
  const column = Number(match[2])
  const severity = match[3]?.toLowerCase() as EslintSeverity
  const { message, rule } = parseRuleAndMessage(match[4] ?? "")

  if (Number.isNaN(lineNum) || Number.isNaN(column)) {
    return undefined
  }

  return {
    path: currentPath,
    line: lineNum,
    column,
    severity,
    rule,
    message,
    sourceLine,
    raw: trimmed,
  }
}

function parseDiagnosticLine(
  line: string,
  sourceLine: number,
  currentPath?: string,
): { diagnostic?: EslintDiagnostic; path?: string } {
  const trimmed = stripAnsi(line.trimEnd())
  if (!trimmed) {
    return {}
  }

  if (PROBLEMS_RE.test(trimmed)) {
    return {}
  }

  const stylish = parseStylishLine(line, sourceLine, currentPath)
  if (stylish) {
    return { diagnostic: stylish }
  }

  const unix = UNIX_RE.exec(trimmed)
  if (unix) {
    const path = unix[1]?.trim()
    const lineNum = Number(unix[2])
    const column = Number(unix[3])
    const message = unix[4]?.trim() ?? ""
    const severity = unix[5]?.toLowerCase() === "warning" ? "warning" : "error"
    const rule = unix[6] ?? ""
    if (path && !Number.isNaN(lineNum) && !Number.isNaN(column)) {
      return {
        diagnostic: {
          path,
          line: lineNum,
          column,
          severity,
          rule,
          message,
          sourceLine,
          raw: trimmed,
        },
      }
    }
  }

  const compact = COMPACT_RE.exec(trimmed)
  if (compact) {
    const path = compact[1]?.trim()
    const lineNum = Number(compact[2])
    const column = Number(compact[3])
    const severity = compact[4]?.toLowerCase() === "warning" ? "warning" : "error"
    const message = compact[5]?.trim() ?? ""
    const rule = compact[6] ?? ""
    if (path && !Number.isNaN(lineNum) && !Number.isNaN(column)) {
      return {
        diagnostic: {
          path,
          line: lineNum,
          column,
          severity,
          rule,
          message,
          sourceLine,
          raw: trimmed,
        },
      }
    }
  }

  if (!trimmed.startsWith(" ") && !trimmed.startsWith("\t")) {
    const looksLikePath =
      FILE_PATH_RE.test(trimmed) ||
      trimmed.includes("/") ||
      trimmed.startsWith(".\\")
    if (looksLikePath && !STYLISH_PREFIX_RE.test(trimmed)) {
      return { path: trimmed }
    }
  }

  return {}
}

export type ParseEslintOptions = {
  hideNodeModules?: boolean
}

export function diagnosticLocation(d: EslintDiagnostic): string {
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
 * Parse pasted ESLint (`pnpm lint`, `eslint`, CI) output into structured diagnostics.
 */
export function parseEslintOutput(
  text: string,
  options: ParseEslintOptions = {},
): EslintParseResult {
  const hideNodeModules = options.hideNodeModules ?? true
  const warnings: string[] = []
  const diagnostics: EslintDiagnostic[] = []
  const unique: EslintDiagnostic[] = []
  const seen = new Set<string>()
  const byRule = emptyByRule()
  let errors = 0
  let warningsCount = 0
  let skipped = 0

  const lines = text.split(/\r?\n/)
  let currentPath: string | undefined

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? ""
    const parsed = parseDiagnosticLine(rawLine, i + 1, currentPath)

    if (parsed.path) {
      currentPath = parsed.path
      continue
    }

    const diagnostic = parsed.diagnostic
    if (!diagnostic) {
      continue
    }

    if (
      diagnostic.path &&
      hideNodeModules &&
      isNodeModulesPath(diagnostic.path)
    ) {
      skipped++
      continue
    }

    pushDiagnostic(diagnostics, seen, unique, diagnostic)
    const ruleKey = diagnostic.rule || "(no rule)"
    byRule[ruleKey] = (byRule[ruleKey] ?? 0) + 1
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
      "Paste output from `pnpm lint`, `eslint`, or your CI lint step.",
    )
  } else if (diagnostics.length === 0) {
    warnings.push(
      "No ESLint diagnostics found. Expected stylish lines like `  10:5  error  message  rule-id` or unix `file:10:5: message. [Error/rule]`.",
    )
  } else if (skipped > 0) {
    warnings.push(
      `Filtered ${skipped} diagnostic(s) under node_modules. Turn off the switch to include them.`,
    )
  }

  return {
    diagnostics,
    unique,
    summary: { errors, warnings: warningsCount, byRule },
    fileCount: filePaths.size,
    warnings,
  }
}

export function formatEslintMarkdown(result: EslintParseResult): string {
  if (result.diagnostics.length === 0) {
    return "_No diagnostics found._"
  }

  const { summary } = result
  const ruleParts = Object.entries(summary.byRule)
    .sort((a, b) => b[1] - a[1])
    .map(([rule, count]) => `${rule}: ${count}`)
  const lines = [
    `**${summary.errors}** error(s), **${summary.warnings}** warning(s) across **${result.fileCount}** file(s)`,
    ruleParts.length ? `Rules — ${ruleParts.join(", ")}` : "",
    "",
  ].filter(Boolean)

  for (const d of result.diagnostics) {
    const loc = diagnosticLocation(d)
    const sev = d.severity === "error" ? "error" : "warning"
    const rule = d.rule ? ` \`${d.rule}\`` : ""
    lines.push(`- (${sev}) \`${loc}\`${rule} — ${d.message}`)
  }

  return lines.join("\n")
}

export function formatEslintPaths(result: EslintParseResult): string {
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
