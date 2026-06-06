import type { TestFailure, TestParseResult } from "./types"

const ANSI_RE = /\x1b\[[0-9;]*m/g

/** Node TAP: `not ok 1 - test name` */
const NODE_NOT_OK_RE = /^not ok \d+ - (.+)$/

/** Node TAP YAML: `location: '/path/file.ts:line:col'` */
const NODE_LOCATION_RE = /^location:\s*'([^']+)'/

/** Vitest: `FAIL  path > suite > test` */
const VITEST_FAIL_RE = /^FAIL\s+(.+?)\s+>\s+(.+)$/

/** Jest suite line: `● suite › test` */
const JEST_BULLET_RE = /^\s*●\s+(.+)$/

/** Stack frame: `(path:line:col)` or `at fn (path:line:col)` */
const PAREN_STACK_RE = /\(([^\s()]+):(\d+):(\d+)\)/
const STACK_FRAME_RE =
  /(?:at\s+(?:\S+\s+)?\(|^|\s)([^\s(]+):(\d+):(\d+)\)?$/

/** Vitest pointer: `❯ path:line:col` */
const VITEST_POINTER_RE = /^\s*❯\s+(.+?):(\d+):(\d+)\s*$/

/** Node summary: `# fail 3` */
const NODE_SUMMARY_RE = /^#\s+(tests|pass|fail|skipped)\s+(\d+)/

function stripAnsi(line: string): string {
  return line.replace(ANSI_RE, "")
}

function isNodeModulesPath(path: string): boolean {
  return /(?:^|\/)node_modules(?:\/|$)/.test(path)
}

function isInternalStackPath(path: string): boolean {
  return (
    isNodeModulesPath(path) ||
    path.startsWith("node:") ||
    path.includes("node:internal/") ||
    path.includes("node:async_hooks")
  )
}

function normalizePath(path: string): string {
  return path.replace(/^file:\/\//, "").trim()
}

function emptyByFile(): Record<string, number> {
  return {}
}

function failureKey(f: TestFailure): string {
  const loc = f.path && f.line !== undefined ? `${f.path}:${f.line}` : ""
  return `${loc}:${f.suite ?? ""}:${f.name}`
}

function pushFailure(
  all: TestFailure[],
  seen: Set<string>,
  unique: TestFailure[],
  byFile: Record<string, number>,
  failure: TestFailure,
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
}

function parseStackFrame(line: string): Pick<TestFailure, "path" | "line" | "column"> | undefined {
  const trimmed = stripAnsi(line).trim()
  const paren = PAREN_STACK_RE.exec(trimmed)
  const match = paren ?? STACK_FRAME_RE.exec(trimmed)
  if (!match) {
    return undefined
  }
  const path = normalizePath(match[1] ?? "")
  const lineNum = Number(match[2])
  const column = Number(match[3])
  if (!path || Number.isNaN(lineNum) || Number.isNaN(column)) {
    return undefined
  }
  if (isInternalStackPath(path)) {
    return undefined
  }
  return { path, line: lineNum, column }
}

function parseVitestPointer(line: string): Pick<TestFailure, "path" | "line" | "column"> | undefined {
  const match = VITEST_POINTER_RE.exec(stripAnsi(line).trim())
  if (!match) {
    return undefined
  }
  const path = normalizePath(match[1] ?? "")
  const lineNum = Number(match[2])
  const column = Number(match[3])
  if (!path || Number.isNaN(lineNum) || Number.isNaN(column)) {
    return undefined
  }
  return { path, line: lineNum, column }
}

function parseVitestFailLine(line: string, sourceLine: number): TestFailure | undefined {
  const trimmed = stripAnsi(line).trim()
  const match = VITEST_FAIL_RE.exec(trimmed)
  if (!match) {
    return undefined
  }
  const path = normalizePath(match[1]?.trim() ?? "")
  const rest = match[2]?.trim() ?? ""
  if (!path || !rest) {
    return undefined
  }
  const segments = rest.split(" > ").map((s) => s.trim())
  const name = segments.at(-1) ?? rest
  const suite = segments.length > 1 ? segments.slice(0, -1).join(" > ") : undefined
  return {
    path,
    suite,
    name,
    format: "vitest",
    sourceLine,
    raw: trimmed,
  }
}

function parseJestFailHeader(line: string, sourceLine: number): Pick<TestFailure, "path" | "name" | "format" | "sourceLine" | "raw"> | undefined {
  const trimmed = stripAnsi(line).trim()
  if (!trimmed.startsWith("FAIL  ")) {
    return undefined
  }
  const path = normalizePath(trimmed.slice("FAIL  ".length).trim())
  if (!path || path.includes(">")) {
    return undefined
  }
  return {
    path,
    name: path.split("/").pop() ?? path,
    format: "jest",
    sourceLine,
    raw: trimmed,
  }
}

function attachLocation(
  failure: TestFailure,
  loc: Pick<TestFailure, "path" | "line" | "column">,
): TestFailure {
  return {
    ...failure,
    path: loc.path ?? failure.path,
    line: loc.line ?? failure.line,
    column: loc.column ?? failure.column,
  }
}

export type ParseTestOptions = {
  hideNodeModules?: boolean
}

export function failureLocation(f: TestFailure): string {
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
 * Parse pasted test runner output (Node TAP, Vitest, Jest) into structured failures.
 */
export function parseTestOutput(
  text: string,
  options: ParseTestOptions = {},
): TestParseResult {
  const hideNodeModules = options.hideNodeModules ?? true
  const warnings: string[] = []
  const failures: TestFailure[] = []
  const unique: TestFailure[] = []
  const seen = new Set<string>()
  const byFile = emptyByFile()
  let skipped = 0

  let reportedTotal: number | undefined
  let reportedPassed: number | undefined
  let reportedFailed: number | undefined
  let reportedSkipped: number | undefined

  let pendingNode: TestFailure | undefined
  let pendingNodeIsSuiteRollup = false
  let pendingNodeInStack = false
  let pendingJest: TestFailure | undefined
  let currentSuite: string | undefined

  const lines = text.split(/\r?\n/)

  function flushNodeFailure() {
    if (!pendingNode) {
      return
    }
    if (
      pendingNodeIsSuiteRollup ||
      (!pendingNode.path &&
        /subtests? failed/i.test(pendingNode.message ?? pendingNode.name))
    ) {
      pendingNode = undefined
      pendingNodeIsSuiteRollup = false
      pendingNodeInStack = false
      return
    }
    if (
      pendingNode.path &&
      hideNodeModules &&
      isNodeModulesPath(pendingNode.path)
    ) {
      skipped++
      pendingNode = undefined
      pendingNodeIsSuiteRollup = false
      return
    }
    pushFailure(failures, seen, unique, byFile, pendingNode)
    pendingNode = undefined
    pendingNodeIsSuiteRollup = false
    pendingNodeInStack = false
  }

  function flushJestFailure() {
    if (!pendingJest) {
      return
    }
    if (
      pendingJest.path &&
      hideNodeModules &&
      isNodeModulesPath(pendingJest.path)
    ) {
      skipped++
      pendingJest = undefined
      return
    }
    pushFailure(failures, seen, unique, byFile, pendingJest)
    pendingJest = undefined
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? ""
    const trimmed = stripAnsi(rawLine).trim()

    const summary = NODE_SUMMARY_RE.exec(trimmed)
    if (summary) {
      const key = summary[1]
      const value = Number(summary[2])
      if (!Number.isNaN(value)) {
        if (key === "tests") {
          reportedTotal = value
        } else if (key === "pass") {
          reportedPassed = value
        } else if (key === "fail") {
          reportedFailed = value
        } else if (key === "skipped") {
          reportedSkipped = value
        }
      }
      continue
    }

    const vitestFail = parseVitestFailLine(rawLine, i + 1)
    if (vitestFail) {
      flushNodeFailure()
      flushJestFailure()
      if (
        vitestFail.path &&
        hideNodeModules &&
        isNodeModulesPath(vitestFail.path)
      ) {
        skipped++
      } else {
        pushFailure(failures, seen, unique, byFile, vitestFail)
      }
      currentSuite = undefined
      continue
    }

    const jestHeader = parseJestFailHeader(rawLine, i + 1)
    if (jestHeader) {
      flushNodeFailure()
      flushJestFailure()
      pendingJest = {
        ...jestHeader,
        suite: currentSuite,
      }
      continue
    }

    const nodeNotOk = NODE_NOT_OK_RE.exec(trimmed)
    if (nodeNotOk) {
      flushNodeFailure()
      flushJestFailure()
      pendingNodeIsSuiteRollup = false
      pendingNodeInStack = false
      pendingNode = {
        name: nodeNotOk[1]?.trim() ?? "",
        suite: currentSuite,
        format: "node-tap",
        sourceLine: i + 1,
        raw: trimmed,
      }
      continue
    }

    if (trimmed.startsWith("# Subtest: ")) {
      currentSuite = trimmed.slice("# Subtest: ".length).trim()
      continue
    }

    if (pendingNode) {
      if (trimmed === "---") {
        continue
      }

      if (trimmed.startsWith("stack:")) {
        pendingNodeInStack = true
        const inlineStack = parseStackFrame(trimmed.slice("stack:".length))
        if (inlineStack && !pendingNode.path) {
          pendingNode = attachLocation(pendingNode, inlineStack)
        }
        continue
      }

      const location = NODE_LOCATION_RE.exec(trimmed)
      if (location) {
        const loc = location[1] ?? ""
        const lastColon = loc.lastIndexOf(":")
        const secondLast = loc.lastIndexOf(":", lastColon - 1)
        const path = normalizePath(
          secondLast > 0 ? loc.slice(0, secondLast) : loc.split(":")[0] ?? "",
        )
        const lineNum = Number(loc.slice(secondLast + 1, lastColon))
        const column = Number(loc.slice(lastColon + 1))
        if (path) {
          pendingNode.path = path
          if (!Number.isNaN(lineNum)) {
            pendingNode.line = lineNum
          }
          if (column !== undefined && !Number.isNaN(column)) {
            pendingNode.column = column
          }
        }
        continue
      }

      if (trimmed.startsWith("error:")) {
        pendingNode.message = trimmed.slice("error:".length).trim().replace(/^'|'$/g, "")
        continue
      }

      if (trimmed.startsWith("code:")) {
        pendingNode.code = trimmed.slice("code:".length).trim().replace(/^'|'$/g, "")
        continue
      }

      if (trimmed.startsWith("failureType:")) {
        const failureType = trimmed
          .slice("failureType:".length)
          .trim()
          .replace(/^'|'$/g, "")
        pendingNodeIsSuiteRollup = failureType === "subtestsFailed"
        continue
      }

      if (trimmed === "...") {
        flushNodeFailure()
        continue
      }

      if (pendingNodeInStack || pendingNode.line === undefined) {
        const stackLoc = parseStackFrame(trimmed)
        if (stackLoc && pendingNode.line === undefined) {
          pendingNode = attachLocation(pendingNode, stackLoc)
          pendingNodeInStack = false
          continue
        }
      }
    }

    if (pendingJest) {
      const bullet = JEST_BULLET_RE.exec(trimmed)
      if (bullet) {
        const parts = bullet[1]?.split(" › ") ?? []
        pendingJest.suite = parts.slice(0, -1).join(" › ") || pendingJest.suite
        pendingJest.name = parts.at(-1) ?? bullet[1] ?? pendingJest.name
        continue
      }

      const stackLoc = parseStackFrame(trimmed)
      if (stackLoc) {
        pendingJest = attachLocation(pendingJest, stackLoc)
        continue
      }

      if (trimmed.startsWith("Expected:") || trimmed.startsWith("Received:")) {
        const hint = trimmed
        pendingJest.message = pendingJest.message
          ? `${pendingJest.message} | ${hint}`
          : hint
        continue
      }

      if (/^\s{2,}\d+\s*\|/.test(rawLine) || trimmed === "") {
        continue
      }

      if (/^at\s/.test(trimmed) || STACK_FRAME_RE.test(trimmed)) {
        const stackLoc = parseStackFrame(trimmed)
        if (stackLoc) {
          pendingJest = attachLocation(pendingJest, stackLoc)
        }
        flushJestFailure()
        continue
      }
    }

    const vitestPointer = parseVitestPointer(rawLine)
    if (vitestPointer && failures.length > 0) {
      const last = failures[failures.length - 1]
      if (last && last.format === "vitest" && last.line === undefined) {
        failures[failures.length - 1] = attachLocation(last, vitestPointer)
        const key = failureKey(last)
        const uniqueIndex = unique.findIndex((f) => failureKey(f) === key)
        if (uniqueIndex >= 0) {
          unique[uniqueIndex] = failures[failures.length - 1]!
        }
        if (vitestPointer.path) {
          byFile[vitestPointer.path] = (byFile[vitestPointer.path] ?? 0) + 1
        }
      }
      continue
    }
  }

  flushNodeFailure()
  flushJestFailure()

  const filePaths = new Set<string>()
  for (const f of failures) {
    if (f.path) {
      filePaths.add(f.path)
    }
  }

  const failed = failures.length
  const summary = {
    failed,
    passed: reportedPassed,
    total: reportedTotal,
    skipped: reportedSkipped,
    byFile,
  }

  if (!text.trim()) {
    warnings.push(
      "Paste output from `pnpm test`, Vitest, Jest, or your CI test step.",
    )
  } else if (failures.length === 0) {
    warnings.push(
      "No test failures found. Expected `not ok`, `FAIL`, or stack frames with file:line paths.",
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
      `Runner reported ${reportedFailed} failure(s); parsed ${failed} after filters and format detection.`,
    )
  }

  return {
    failures,
    unique,
    summary,
    fileCount: filePaths.size,
    warnings,
  }
}

export function formatTestMarkdown(result: TestParseResult): string {
  if (result.failures.length === 0) {
    return "_No test failures found._"
  }

  const { summary } = result
  const parts: string[] = [
    `**${summary.failed}** failure(s) across **${result.fileCount}** file(s)`,
  ]
  if (summary.total !== undefined) {
    parts[0] += ` (${summary.passed ?? 0} passed of ${summary.total} total)`
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
    const suite = f.suite ? `${f.suite} › ` : ""
    const msg = f.message ? ` — ${f.message}` : ""
    parts.push(`- \`${loc}\` **${suite}${f.name}**${msg}`)
  }

  return parts.join("\n")
}

export function formatTestPaths(result: TestParseResult): string {
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
