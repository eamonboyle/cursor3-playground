import type {
  SnapshotFailure,
  SnapshotFailureKind,
  SnapshotParseOptions,
  SnapshotParseResult,
} from "./types"

const ANSI_RE = /\x1b\[[0-9;]*m/g

/** Vitest: `FAIL  path > suite > test` */
const VITEST_FAIL_RE = /^FAIL\s+(.+?)\s+>\s+(.+?)\s+>\s+(.+)$/

/** Jest / generic: `FAIL  path` */
const JEST_FAIL_RE = /^FAIL\s+(.+?\.(?:test|spec)\.[jt]sx?)\s*$/

/** Jest bullet: `● suite › test` */
const JEST_BULLET_RE = /^\s*●\s+(.+?)\s+›\s+(.+)$/

/** `Snapshot name: \`name\`` */
const SNAPSHOT_NAME_RE = /Snapshot name:\s*`([^`]+)`/

/** Vitest: `Snapshot \`name\` mismatched` */
const SNAPSHOT_MISMATCH_RE = /Snapshot\s+`([^`]+)`\s+mismatched/

/** Diff header: `- Snapshot  - 5` */
const SNAPSHOT_MINUS_RE = /^-\s*Snapshot\s+-\s+(\d+)/

/** Diff header: `+ Received  + 7` */
const RECEIVED_PLUS_RE = /^\+\s*Received\s+\+\s+(\d+)/

/** Summary: `2 snapshots failed` or `Snapshots  1 failed` */
const FAILED_COUNT_RE =
  /(?:(\d+)\s+snapshots?\s+failed|snapshots?\s+(\d+)\s+failed)/i

/** Summary: `1 obsolete snapshot` or `1 snapshot file obsolete` */
const OBSOLETE_COUNT_RE =
  /(?:(\d+)\s+obsolete snapshots?|(\d+)\s+snapshot files? obsolete)/i

/** Summary: `3 snapshots updated` */
const UPDATED_COUNT_RE = /(\d+)\s+snapshots?\s+updated/i

/** Summary: `1 snapshot written` */
const WRITTEN_COUNT_RE = /(\d+)\s+snapshots?\s+written/i

/** `.snap` file path */
const SNAP_PATH_RE =
  /(?:^|\s)((?:\.\/)?[\w@./\-[\]()+\s]+__snapshots__\/[\w@./\-[\]()+\s]+\.snap)/

/** Vitest pointer: `❯ path:line:col` */
const VITEST_POINTER_RE = /^\s*❯\s+(.+?):(\d+):(\d+)\s*$/

function stripAnsi(line: string): string {
  return line.replace(ANSI_RE, "")
}

function isNodeModulesPath(path: string): boolean {
  return /(?:^|\/)node_modules(?:\/|$)/.test(path)
}

function normalizePath(path: string): string {
  return path.replace(/^file:\/\//, "").replace(/\\/g, "/").trim()
}

function emptyByFile(): Record<string, number> {
  return {}
}

function failureKey(f: SnapshotFailure): string {
  return [
    f.path ?? "",
    f.snapshotName ?? "",
    f.kind,
    f.sourceLine,
  ].join(":")
}

function pushFailure(
  all: SnapshotFailure[],
  seen: Set<string>,
  byFile: Record<string, number>,
  failure: SnapshotFailure,
) {
  const key = failureKey(failure)
  if (seen.has(key)) {
    return
  }
  seen.add(key)
  all.push(failure)
  if (failure.path) {
    byFile[failure.path] = (byFile[failure.path] ?? 0) + 1
  }
}

function parseSuiteTest(
  suitePart: string,
  testPart: string,
): { suite?: string; testName?: string } {
  const suite = suitePart.trim() || undefined
  const testName = testPart.trim() || undefined
  return { suite, testName }
}

/**
 * Parse pasted Jest or Vitest snapshot failure output.
 */
export function parseSnapshotOutput(
  text: string,
  options: SnapshotParseOptions = {},
): SnapshotParseResult {
  const warnings: string[] = []
  const failures: SnapshotFailure[] = []
  const seen = new Set<string>()
  const byFile = emptyByFile()

  let currentPath: string | undefined
  let currentSuite: string | undefined
  let currentTest: string | undefined
  let currentSnapshotName: string | undefined
  let currentRemoved: number | undefined
  let currentAdded: number | undefined
  let pendingKind: SnapshotFailureKind = "mismatch"

  let failed = 0
  let obsolete = 0
  let updated = 0
  let written = 0

  const lines = text.split(/\r?\n/)

  function flushCurrent(sourceLine: number, raw: string) {
    if (!currentSnapshotName && !currentSnapshotPath) {
      return
    }
    const failure: SnapshotFailure = {
      path: currentPath,
      suite: currentSuite,
      testName: currentTest,
      snapshotName: currentSnapshotName,
      snapshotPath: currentSnapshotPath,
      kind: pendingKind,
      removedLines: currentRemoved,
      addedLines: currentAdded,
      sourceLine,
      raw: raw.trimEnd() || snapshotLocation({
        path: currentPath,
        testName: currentTest,
        snapshotName: currentSnapshotName,
        snapshotPath: currentSnapshotPath,
        kind: pendingKind,
        sourceLine,
        raw: "",
      }),
    }
    if (options.hideNodeModules && failure.path && isNodeModulesPath(failure.path)) {
      return
    }
    pushFailure(failures, seen, byFile, failure)
    currentSnapshotName = undefined
    currentSnapshotPath = undefined
    currentRemoved = undefined
    currentAdded = undefined
    pendingKind = "mismatch"
  }

  function resetTestContext() {
    currentPath = undefined
    currentSuite = undefined
    currentTest = undefined
    currentSnapshotName = undefined
    currentSnapshotPath = undefined
    currentRemoved = undefined
    currentAdded = undefined
    pendingKind = "mismatch"
  }

  let currentSnapshotPath: string | undefined

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? ""
    const line = stripAnsi(rawLine).trimEnd()
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const failedMatch = FAILED_COUNT_RE.exec(trimmed)
    if (failedMatch) {
      failed = Math.max(failed, Number(failedMatch[1] ?? failedMatch[2]))
    }
    const obsoleteMatch = OBSOLETE_COUNT_RE.exec(trimmed)
    if (obsoleteMatch) {
      obsolete = Math.max(obsolete, Number(obsoleteMatch[1] ?? obsoleteMatch[2]))
    }
    const updatedMatch = UPDATED_COUNT_RE.exec(trimmed)
    if (updatedMatch) {
      updated = Math.max(updated, Number(updatedMatch[1]))
    }
    const writtenMatch = WRITTEN_COUNT_RE.exec(trimmed)
    if (writtenMatch) {
      written = Math.max(written, Number(writtenMatch[1]))
    }

    if (/obsolete snapshot/i.test(trimmed)) {
      pendingKind = "obsolete"
    }
    if (/inline snapshot/i.test(trimmed)) {
      pendingKind = "inline"
    }
    if (/snapshot written/i.test(trimmed) && !FAILED_COUNT_RE.test(trimmed)) {
      pendingKind = "new"
    }

    const vitestFail = VITEST_FAIL_RE.exec(trimmed)
    if (vitestFail) {
      flushCurrent(i + 1, rawLine)
      resetTestContext()
      currentPath = normalizePath(vitestFail[1] ?? "")
      const parts = parseSuiteTest(vitestFail[2] ?? "", vitestFail[3] ?? "")
      currentSuite = parts.suite
      currentTest = parts.testName
      continue
    }

    const jestFail = JEST_FAIL_RE.exec(trimmed)
    if (jestFail) {
      flushCurrent(i + 1, rawLine)
      resetTestContext()
      currentPath = normalizePath(jestFail[1] ?? "")
      continue
    }

    const bullet = JEST_BULLET_RE.exec(trimmed)
    if (bullet) {
      const parts = parseSuiteTest(bullet[1] ?? "", bullet[2] ?? "")
      currentSuite = parts.suite
      currentTest = parts.testName
      continue
    }

    const snapName = SNAPSHOT_NAME_RE.exec(trimmed)
    if (snapName) {
      currentSnapshotName = snapName[1]?.trim()
      continue
    }

    const mismatch = SNAPSHOT_MISMATCH_RE.exec(trimmed)
    if (mismatch) {
      currentSnapshotName = mismatch[1]?.trim()
      continue
    }

    const minus = SNAPSHOT_MINUS_RE.exec(trimmed)
    if (minus) {
      currentRemoved = Number(minus[1])
      continue
    }

    const plus = RECEIVED_PLUS_RE.exec(trimmed)
    if (plus) {
      currentAdded = Number(plus[1])
      flushCurrent(i + 1, rawLine)
      continue
    }

    const pointer = VITEST_POINTER_RE.exec(trimmed)
    if (pointer) {
      const path = normalizePath(pointer[1] ?? "")
      if (path) {
        currentPath = path
      }
      continue
    }

    const snapPath = SNAP_PATH_RE.exec(trimmed)
    if (snapPath) {
      const path = normalizePath(snapPath[1] ?? "")
      if (path.endsWith(".snap")) {
        const failure: SnapshotFailure = {
          snapshotPath: path,
          kind: pendingKind === "mismatch" ? "obsolete" : pendingKind,
          sourceLine: i + 1,
          raw: trimmed,
        }
        if (!options.hideNodeModules || !isNodeModulesPath(path)) {
          pushFailure(failures, seen, byFile, failure)
        }
      }
      continue
    }

    if (
      trimmed.includes("__snapshots__") &&
      trimmed.endsWith(".snap")
    ) {
      const path = normalizePath(trimmed.replace(/^[\s↳•-]+/, ""))
      const failure: SnapshotFailure = {
        snapshotPath: path,
        kind: "obsolete",
        sourceLine: i + 1,
        raw: trimmed,
      }
      if (!options.hideNodeModules || !isNodeModulesPath(path)) {
        pushFailure(failures, seen, byFile, failure)
      }
    }
  }

  flushCurrent(lines.length, "")

  if (!text.trim()) {
    warnings.push(
      "Paste Jest or Vitest snapshot failure output from `pnpm test` or `vitest run`.",
    )
  } else if (failures.length === 0 && failed === 0) {
    warnings.push(
      "No snapshot failures found. Look for FAIL lines, Snapshot name, or snapshot summary counts.",
    )
  }

  if (failed > 0 && failures.length > 0 && failed !== failures.length) {
    warnings.push(
      `Summary reports ${failed} failed snapshot(s); parsed ${failures.length} detail row(s).`,
    )
  }

  return {
    failures,
    summary: {
      total: failures.length,
      failed,
      obsolete,
      updated,
      written,
      byFile,
    },
    warnings,
  }
}

export function snapshotLocation(failure: SnapshotFailure): string {
  if (failure.path && failure.testName) {
    return `${failure.path} › ${failure.testName}`
  }
  if (failure.path) {
    return failure.path
  }
  if (failure.snapshotPath) {
    return failure.snapshotPath
  }
  if (failure.snapshotName) {
    return failure.snapshotName
  }
  return `input line ${failure.sourceLine}`
}

export function formatSnapshotPaths(result: SnapshotParseResult): string {
  const paths = new Set<string>()
  for (const f of result.failures) {
    if (f.path) {
      paths.add(f.path)
    }
    if (f.snapshotPath) {
      paths.add(f.snapshotPath)
    }
  }
  return [...paths].join("\n")
}

export function formatSnapshotUpdateCommand(
  packageManager: "pnpm" | "npm" = "pnpm",
): string {
  return `${packageManager} test -- -u`
}

export function formatSnapshotMarkdown(result: SnapshotParseResult): string {
  if (result.failures.length === 0 && result.summary.failed === 0) {
    return "_No snapshot failures found._"
  }

  const lines: string[] = []
  const { summary } = result

  const summaryParts: string[] = []
  if (summary.failed > 0) {
    summaryParts.push(`${summary.failed} failed`)
  }
  if (summary.obsolete > 0) {
    summaryParts.push(`${summary.obsolete} obsolete`)
  }
  if (summary.updated > 0) {
    summaryParts.push(`${summary.updated} updated`)
  }
  if (summary.written > 0) {
    summaryParts.push(`${summary.written} written`)
  }

  lines.push(
    summaryParts.length
      ? `**Snapshot summary** — ${summaryParts.join(", ")}`
      : `**${summary.total}** snapshot issue(s)`,
    "",
  )

  for (const f of result.failures) {
    const loc = snapshotLocation(f)
    const diff =
      f.removedLines !== undefined || f.addedLines !== undefined
        ? ` (−${f.removedLines ?? 0}/+${f.addedLines ?? 0})`
        : ""
    const name = f.snapshotName ? ` — \`${f.snapshotName}\`` : ""
    lines.push(`- **${f.kind}** \`${loc}\`${name}${diff}`)
    if (f.snapshotPath && f.snapshotPath !== loc) {
      lines.push(`  - snap: \`${f.snapshotPath}\``)
    }
  }

  lines.push("", `Update: \`${formatSnapshotUpdateCommand()}\``)
  return lines.join("\n").trimEnd()
}
