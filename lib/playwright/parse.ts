import type { PlaywrightFailure, PlaywrightParseResult } from "./types"

const ANSI_RE = /\x1b\[[0-9;]*m/g

/** Inline run line: `✘  [chromium] › path:line:col › suite › test (5s)` */
const INLINE_FAIL_RE =
  /^\s*[✘×✗]\s+(?:(?:\[[\w.\-]+\]\s+›\s+))?(.+?):(\d+):(\d+)\s+›\s+(.+)$/

/** Numbered block header: `  1) [chromium] › path:line:col › suite › test` */
const NUMBERED_FAIL_RE =
  /^\s*\d+\)\s+(?:(?:\[[\w.\-]+\]\s+›\s+))?(.+?):(\d+):(\d+)\s+›\s+(.+)$/

/** Summary list item under `N failed`. */
const SUMMARY_FAIL_RE =
  /^\s{2,}(?:(?:\[[\w.\-]+\]\s+›\s+))?(.+?):(\d+):(\d+)\s+›\s+(.+)$/

const FAILED_COUNT_RE = /^\s*(\d+)\s+failed\b/
const PASSED_COUNT_RE = /^\s*(\d+)\s+passed\b/
const PROJECT_RE = /\[([\w.\-]+)\]\s+›/

const STACK_AT_RE =
  /^\s*at\s+(?:async\s+)?(?:.*?\s+)?\(?([^\s()]+):(\d+):(\d+)\)?/

const ERROR_LINE_RE = /^\s*(?:Error|TimeoutError|AssertionError):\s*(.+)$/

function stripAnsi(line: string): string {
  return line.replace(ANSI_RE, "")
}

function normalizePath(path: string): string {
  return path.replace(/^file:\/\//, "").trim()
}

function isNodeModulesPath(path: string): boolean {
  return /(?:^|\/)node_modules(?:\/|$)/.test(path)
}

function emptyByFile(): Record<string, number> {
  return {}
}

function emptyByProject(): Record<string, number> {
  return {}
}

function failureKey(f: PlaywrightFailure): string {
  const loc = f.path && f.line !== undefined ? `${f.path}:${f.line}` : ""
  return `${loc}:${f.project ?? ""}:${f.suite ?? ""}:${f.name}`
}

function parseProject(raw: string): string | undefined {
  const match = PROJECT_RE.exec(raw)
  return match?.[1]
}

function stripTimingSuffix(title: string): string {
  return title
    .replace(/\s+\(retry\s+#\d+\)/i, "")
    .replace(/\s+\([\d.]+(?:ms|s)\)\s*$/, "")
    .replace(/\s+─+\s*$/, "")
    .trim()
}

function splitSuiteAndName(title: string): { suite?: string; name: string } {
  const cleaned = stripTimingSuffix(title)
  const segments = cleaned.split(" › ").map((part) => part.trim())
  if (segments.length <= 1) {
    return { name: cleaned }
  }
  return {
    suite: segments.slice(0, -1).join(" › "),
    name: segments.at(-1) ?? cleaned,
  }
}

function parseHeaderLine(
  rawLine: string,
  sourceLine: number,
  origin: PlaywrightFailure["origin"],
): PlaywrightFailure | undefined {
  const trimmed = stripAnsi(rawLine).trimEnd()
  const match =
    INLINE_FAIL_RE.exec(trimmed) ??
    NUMBERED_FAIL_RE.exec(trimmed) ??
    SUMMARY_FAIL_RE.exec(trimmed)
  if (!match) {
    return undefined
  }

  const path = normalizePath(match[1] ?? "")
  const line = Number(match[2])
  const column = Number(match[3])
  const title = match[4] ?? ""
  if (!path || !title || Number.isNaN(line) || Number.isNaN(column)) {
    return undefined
  }

  const { suite, name } = splitSuiteAndName(title)
  return {
    path,
    line,
    column,
    project: parseProject(trimmed),
    suite,
    name,
    sourceLine,
    raw: trimmed,
    origin,
  }
}

function parseStackFrame(
  line: string,
): Pick<PlaywrightFailure, "path" | "line" | "column"> | undefined {
  const trimmed = stripAnsi(line).trim()
  const match = STACK_AT_RE.exec(trimmed)
  if (!match) {
    return undefined
  }
  const path = normalizePath(match[1] ?? "")
  const lineNum = Number(match[2])
  const column = Number(match[3])
  if (!path || Number.isNaN(lineNum) || Number.isNaN(column)) {
    return undefined
  }
  if (
    isNodeModulesPath(path) ||
    path.startsWith("node:") ||
    path.includes("node:internal/")
  ) {
    return undefined
  }
  return { path, line: lineNum, column }
}

function attachLocation(
  failure: PlaywrightFailure,
  loc: Pick<PlaywrightFailure, "path" | "line" | "column">,
): PlaywrightFailure {
  return {
    ...failure,
    path: loc.path ?? failure.path,
    line: loc.line ?? failure.line,
    column: loc.column ?? failure.column,
  }
}

function failurePriority(f: PlaywrightFailure): number {
  const originScore =
    f.origin === "numbered" ? 3 : f.origin === "summary" ? 2 : 1
  const messageScore = f.message ? 2 : 0
  return originScore + messageScore
}

function dedupeFailures(failures: PlaywrightFailure[]): PlaywrightFailure[] {
  const bestByKey = new Map<string, PlaywrightFailure>()
  for (const failure of failures) {
    const key = `${failure.project ?? ""}:${failure.path ?? ""}:${failure.name}`
    const existing = bestByKey.get(key)
    if (!existing || failurePriority(failure) > failurePriority(existing)) {
      bestByKey.set(key, failure)
    }
  }
  const kept = new Set(bestByKey.values())
  return failures.filter((failure) => kept.has(failure))
}

function pushFailure(
  all: PlaywrightFailure[],
  seen: Set<string>,
  unique: PlaywrightFailure[],
  byFile: Record<string, number>,
  byProject: Record<string, number>,
  failure: PlaywrightFailure,
) {
  all.push(failure)
  const key = failureKey(failure)
  if (!seen.has(key)) {
    seen.add(key)
    unique.push(failure)
  }
  if (failure.path) {
    byFile[failure.path] = (byFile[failure.path] ?? 0) + 1
  }
  if (failure.project) {
    byProject[failure.project] = (byProject[failure.project] ?? 0) + 1
  }
}

export type ParsePlaywrightOptions = {
  hideNodeModules?: boolean
}

export function failureLocation(f: PlaywrightFailure): string {
  if (f.path && f.line !== undefined) {
    const col = f.column !== undefined ? `:${f.column}` : ""
    return `${f.path}:${f.line}${col}`
  }
  if (f.path) {
    return f.path
  }
  return `line ${f.sourceLine}`
}

/**
 * Parse pasted Playwright test output into structured failures with file:line paths.
 */
export function parsePlaywrightOutput(
  text: string,
  options: ParsePlaywrightOptions = {},
): PlaywrightParseResult {
  const hideNodeModules = options.hideNodeModules ?? true
  const warnings: string[] = []
  const failures: PlaywrightFailure[] = []
  const unique: PlaywrightFailure[] = []
  const seen = new Set<string>()
  const byFile = emptyByFile()
  const byProject = emptyByProject()
  let skipped = 0

  let reportedFailed: number | undefined
  let reportedPassed: number | undefined

  let pending: PlaywrightFailure | undefined
  const lines = text.split(/\r?\n/)

  function flushPending() {
    if (!pending) {
      return
    }
    if (
      pending.path &&
      hideNodeModules &&
      isNodeModulesPath(pending.path)
    ) {
      skipped++
      pending = undefined
      return
    }
    pushFailure(failures, seen, unique, byFile, byProject, pending)
    pending = undefined
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? ""
    const trimmed = stripAnsi(rawLine).trimEnd()

    const failedCount = FAILED_COUNT_RE.exec(trimmed)
    if (failedCount) {
      reportedFailed = Number(failedCount[1])
      continue
    }

    const passedCount = PASSED_COUNT_RE.exec(trimmed)
    if (passedCount) {
      reportedPassed = Number(passedCount[1])
      continue
    }

    const header = parseHeaderLine(
      rawLine,
      i + 1,
      INLINE_FAIL_RE.test(trimmed)
        ? "inline"
        : NUMBERED_FAIL_RE.test(trimmed)
          ? "numbered"
          : "summary",
    )
    if (header) {
      const isSummaryItem = SUMMARY_FAIL_RE.test(trimmed)
      const isInline = INLINE_FAIL_RE.test(trimmed)
      const isNumbered = NUMBERED_FAIL_RE.test(trimmed)

      if (isNumbered) {
        flushPending()
        pending = header
        continue
      }

      if (isInline || isSummaryItem) {
        if (
          header.path &&
          hideNodeModules &&
          isNodeModulesPath(header.path)
        ) {
          skipped++
        } else {
          pushFailure(failures, seen, unique, byFile, byProject, header)
        }
        continue
      }
    }

    if (pending) {
      const errorLine = ERROR_LINE_RE.exec(trimmed)
      if (errorLine) {
        pending.message = errorLine[1]?.trim()
        continue
      }

      const stackLoc = parseStackFrame(trimmed)
      if (stackLoc) {
        pending = attachLocation(pending, stackLoc)
        flushPending()
        continue
      }

      if (trimmed === "" || trimmed.startsWith("Call log:")) {
        continue
      }

      if (
        trimmed.startsWith("Expected:") ||
        trimmed.startsWith("Received:") ||
        trimmed.startsWith("waiting for") ||
        trimmed.startsWith("=")
      ) {
        const hint = trimmed
        pending.message = pending.message
          ? `${pending.message} | ${hint}`
          : hint
        continue
      }
    }
  }

  flushPending()

  const dedupedFailures = dedupeFailures(failures)
  const dedupedUnique = dedupeFailures(unique)
  const dedupedByFile = emptyByFile()
  const dedupedByProject = emptyByProject()
  for (const failure of dedupedFailures) {
    if (failure.path) {
      dedupedByFile[failure.path] = (dedupedByFile[failure.path] ?? 0) + 1
    }
    if (failure.project) {
      dedupedByProject[failure.project] =
        (dedupedByProject[failure.project] ?? 0) + 1
    }
  }

  const filePaths = new Set<string>()
  for (const f of dedupedFailures) {
    if (f.path) {
      filePaths.add(f.path)
    }
  }

  const failed = dedupedFailures.length
  const total =
    reportedFailed !== undefined && reportedPassed !== undefined
      ? reportedFailed + reportedPassed
      : undefined

  if (!text.trim()) {
    warnings.push(
      "Paste output from `pnpm exec playwright test` or your CI Playwright step.",
    )
  } else if (dedupedFailures.length === 0) {
    warnings.push(
      "No Playwright failures found. Expected `✘` lines, numbered `1) path:line:col › …` blocks, or `N failed` summaries.",
    )
  } else if (skipped > 0) {
    warnings.push(
      `Filtered ${skipped} failure(s) under node_modules. Turn off the switch to include them.`,
    )
  }

  if (
    reportedFailed !== undefined &&
    reportedFailed !== failed &&
    reportedFailed > 0
  ) {
    warnings.push(
      `Runner reported ${reportedFailed} failure(s); parsed ${failed} after filters and deduplication.`,
    )
  }

  return {
    failures: dedupedFailures,
    unique: dedupedUnique,
    summary: {
      failed,
      passed: reportedPassed,
      total,
      byFile: dedupedByFile,
      byProject: dedupedByProject,
    },
    fileCount: filePaths.size,
    warnings,
  }
}

export function formatPlaywrightMarkdown(result: PlaywrightParseResult): string {
  if (result.failures.length === 0) {
    return "_No Playwright failures found._"
  }

  const { summary } = result
  const parts: string[] = [
    `**${summary.failed}** failure(s) across **${result.fileCount}** file(s)`,
  ]
  if (summary.total !== undefined) {
    parts[0] += ` (${summary.passed ?? 0} passed of ${summary.total} total)`
  }

  const projectParts = Object.entries(summary.byProject)
    .sort((a, b) => b[1] - a[1])
    .map(([project, count]) => `${project}: ${count}`)
  if (projectParts.length) {
    parts.push(`Projects — ${projectParts.join(", ")}`)
  }

  const fileParts = Object.entries(summary.byFile)
    .sort((a, b) => b[1] - a[1])
    .map(([path, count]) => `${path}: ${count}`)
  if (fileParts.length) {
    parts.push(`Files — ${fileParts.join(", ")}`)
  }
  parts.push("")

  for (const f of result.failures) {
    const loc = failureLocation(f)
    const project = f.project ? `[${f.project}] ` : ""
    const suite = f.suite ? `${f.suite} › ` : ""
    const msg = f.message ? ` — ${f.message}` : ""
    parts.push(`- \`${loc}\` **${project}${suite}${f.name}**${msg}`)
  }

  return parts.join("\n")
}

export function formatPlaywrightPaths(result: PlaywrightParseResult): string {
  const paths: string[] = []
  const seen = new Set<string>()
  for (const f of result.unique) {
    if (!f.path || f.line === undefined) {
      continue
    }
    const key = `${f.path}:${f.line}`
    if (!seen.has(key)) {
      seen.add(key)
      paths.push(key)
    }
  }
  return paths.join("\n")
}
