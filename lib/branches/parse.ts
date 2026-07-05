import type {
  BranchEntry,
  BranchFilter,
  BranchKind,
  BranchParseOptions,
  BranchParseResult,
  BranchParseSummary,
  BranchTrackingState,
} from "./types"

const REMOTE_HEAD_RE = /^remotes\/[^/]+\/HEAD\s+->\s+(.+)$/i

const VERBOSE_LINE_RE =
  /^([*+\s])\s+(\S+)\s+([0-9a-f]{7,40})(?:\s+\[([^\]]+)\])?(?:\s+(.*))?$/i

const PLAIN_LINE_RE = /^([*+\s])\s+(.+)$/

function classifyKind(name: string): BranchKind {
  return name.startsWith("remotes/") ? "remote" : "local"
}

function remoteDisplayName(name: string): string {
  if (!name.startsWith("remotes/")) {
    return name
  }
  const withoutPrefix = name.slice("remotes/".length)
  const slash = withoutPrefix.indexOf("/")
  if (slash === -1) {
    return withoutPrefix
  }
  return withoutPrefix.slice(slash + 1)
}

function parseTrackingBracket(
  bracket: string | undefined,
): Pick<BranchEntry, "tracking" | "ahead" | "behind" | "trackingState"> {
  if (!bracket?.trim()) {
    return { trackingState: "none" }
  }

  const trimmed = bracket.trim()
  if (trimmed === "gone") {
    return { trackingState: "gone" }
  }

  const colon = trimmed.indexOf(":")
  const tracking = colon === -1 ? trimmed : trimmed.slice(0, colon).trim()
  const rest = colon === -1 ? "" : trimmed.slice(colon + 1).trim()

  let ahead: number | undefined
  let behind: number | undefined

  const aheadMatch = /ahead\s+(\d+)/i.exec(rest)
  if (aheadMatch) {
    ahead = Number.parseInt(aheadMatch[1] ?? "", 10)
  }

  const behindMatch = /behind\s+(\d+)/i.exec(rest)
  if (behindMatch) {
    behind = Number.parseInt(behindMatch[1] ?? "", 10)
  }

  let trackingState: BranchTrackingState = "synced"
  if (trimmed.includes("gone")) {
    trackingState = "gone"
  } else if (ahead !== undefined && behind !== undefined) {
    trackingState = "diverged"
  } else if (ahead !== undefined) {
    trackingState = "ahead"
  } else if (behind !== undefined) {
    trackingState = "behind"
  }

  return { tracking, ahead, behind, trackingState }
}

function buildSummary(entries: BranchEntry[]): BranchParseSummary {
  let local = 0
  let remote = 0
  let gone = 0
  let ahead = 0
  let behind = 0
  let current: string | undefined

  for (const entry of entries) {
    if (entry.kind === "local") {
      local++
    } else {
      remote++
    }
    if (entry.isCurrent) {
      current = entry.name
    }
    if (entry.trackingState === "gone") {
      gone++
    }
    if (entry.trackingState === "ahead" || entry.trackingState === "diverged") {
      ahead++
    }
    if (entry.trackingState === "behind" || entry.trackingState === "diverged") {
      behind++
    }
  }

  return {
    total: entries.length,
    local,
    remote,
    current,
    gone,
    ahead,
    behind,
  }
}

function detectFormat(
  verboseCount: number,
  plainCount: number,
): BranchParseResult["format"] {
  if (verboseCount > 0 && plainCount > 0) {
    return "mixed"
  }
  if (verboseCount > 0) {
    return "verbose"
  }
  if (plainCount > 0) {
    return "plain"
  }
  return "unknown"
}

/**
 * Parse pasted `git branch -a` or `git branch -vv` output into branch rows.
 */
export function parseBranchOutput(text: string): BranchParseResult {
  const warnings: string[] = []
  const entries: BranchEntry[] = []
  let verboseCount = 0
  let plainCount = 0

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmed = line.trimEnd()
    if (!trimmed) {
      continue
    }

    if (REMOTE_HEAD_RE.test(trimmed.trimStart())) {
      continue
    }

    const verboseMatch = VERBOSE_LINE_RE.exec(trimmed)
    if (verboseMatch) {
      verboseCount++
      const marker = verboseMatch[1] ?? " "
      const name = verboseMatch[2] ?? ""
      const hash = verboseMatch[3]?.toLowerCase()
      const bracket = verboseMatch[4]
      const subject = verboseMatch[5]?.trim() || undefined
      const trackingInfo = parseTrackingBracket(bracket)

      entries.push({
        name,
        displayName: remoteDisplayName(name),
        kind: classifyKind(name),
        isCurrent: marker === "*",
        isMerged: marker === "+",
        hash,
        subject,
        sourceLine: i + 1,
        raw: trimmed,
        ...trackingInfo,
      })
      continue
    }

    const plainMatch = PLAIN_LINE_RE.exec(trimmed)
    if (plainMatch) {
      plainCount++
      const marker = plainMatch[1] ?? " "
      const name = plainMatch[2]?.trim() ?? ""
      if (!name || name.includes("->")) {
        continue
      }

      entries.push({
        name,
        displayName: remoteDisplayName(name),
        kind: classifyKind(name),
        isCurrent: marker === "*",
        isMerged: marker === "+",
        trackingState: "none",
        sourceLine: i + 1,
        raw: trimmed,
      })
    }
  }

  if (!text.trim()) {
    warnings.push(
      "Paste `git branch -a` or `git branch -vv` output to list local and remote branches.",
    )
  } else if (entries.length === 0) {
    warnings.push(
      "No branch rows found. Run `git branch -vv` and paste the full output.",
    )
  }

  return {
    entries,
    summary: buildSummary(entries),
    format: detectFormat(verboseCount, plainCount),
    warnings,
  }
}

export function filterBranchEntries(
  entries: BranchEntry[],
  filter: BranchFilter = "all",
): BranchEntry[] {
  switch (filter) {
    case "all":
      return entries
    case "local":
    case "remote":
      return entries.filter((entry) => entry.kind === filter)
    case "current":
      return entries.filter((entry) => entry.isCurrent)
    case "gone":
      return entries.filter((entry) => entry.trackingState === "gone")
    case "ahead":
      return entries.filter(
        (entry) =>
          entry.trackingState === "ahead" || entry.trackingState === "diverged",
      )
    case "behind":
      return entries.filter(
        (entry) =>
          entry.trackingState === "behind" ||
          entry.trackingState === "diverged",
      )
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

export function branchCheckoutCommand(entry: BranchEntry): string {
  if (entry.kind === "remote") {
    const remote = entry.name.slice("remotes/".length)
    const slash = remote.indexOf("/")
    const remoteName = slash === -1 ? "origin" : remote.slice(0, slash)
    const branchName = slash === -1 ? remote : remote.slice(slash + 1)
    return `git checkout --track ${remoteName}/${branchName}`
  }
  return `git checkout ${entry.name}`
}

export function branchDeleteCommand(entry: BranchEntry, force = false): string {
  if (entry.kind === "remote") {
    const remote = entry.name.slice("remotes/".length)
    const slash = remote.indexOf("/")
    const remoteName = slash === -1 ? "origin" : remote.slice(0, slash)
    const branchName = slash === -1 ? remote : remote.slice(slash + 1)
    return `git push ${remoteName} --delete ${branchName}`
  }
  return force
    ? `git branch -D ${entry.name}`
    : `git branch -d ${entry.name}`
}

export function formatBranchNames(
  result: BranchParseResult,
  options: BranchParseOptions = {},
): string {
  const entries = filterBranchEntries(
    result.entries,
    options.filter ?? "all",
  )
  return entries.map((entry) => entry.name).join("\n")
}

export function formatBranchCheckoutCommands(
  result: BranchParseResult,
  options: BranchParseOptions = {},
): string {
  const entries = filterBranchEntries(
    result.entries,
    options.filter ?? "all",
  )
  return entries.map((entry) => branchCheckoutCommand(entry)).join("\n")
}

export function formatBranchDeleteCommands(
  result: BranchParseResult,
  options: BranchParseOptions = {},
  force = false,
): string {
  const entries = filterBranchEntries(
    result.entries,
    options.filter ?? "all",
  ).filter((entry) => entry.kind === "local" || entry.kind === "remote")
  return entries.map((entry) => branchDeleteCommand(entry, force)).join("\n")
}

export function formatBranchPruneHint(result: BranchParseResult): string {
  const goneLocals = result.entries.filter(
    (entry) => entry.kind === "local" && entry.trackingState === "gone",
  )
  if (goneLocals.length === 0) {
    return ""
  }
  const lines = ["# Branches with [gone] upstream — prune remotes then delete locals:"]
  lines.push("git fetch --prune")
  for (const entry of goneLocals) {
    lines.push(`git branch -d ${entry.name}`)
  }
  return lines.join("\n")
}

export function formatBranchMarkdown(result: BranchParseResult): string {
  if (result.entries.length === 0) {
    return "_No branches found._"
  }

  const { summary } = result
  const lines = [
    `**${summary.total}** branch(es) — ${summary.local} local, ${summary.remote} remote`,
    "",
    "| Branch | Kind | Tracking | Status |",
    "|--------|------|----------|--------|",
  ]

  for (const entry of result.entries) {
    const current = entry.isCurrent ? "*" : entry.isMerged ? "+" : ""
    const tracking = entry.tracking ?? "—"
    let status = entry.trackingState
    if (entry.ahead !== undefined) {
      status = `ahead ${entry.ahead}` as BranchTrackingState
    }
    if (entry.behind !== undefined) {
      status = entry.ahead !== undefined
        ? (`ahead ${entry.ahead}, behind ${entry.behind}` as BranchTrackingState)
        : (`behind ${entry.behind}` as BranchTrackingState)
    }
    lines.push(
      `| ${current} \`${entry.displayName}\` | ${entry.kind} | ${tracking} | ${status} |`,
    )
  }

  return lines.join("\n").trimEnd()
}
