import type {
  ReflogEntry,
  ReflogOperation,
  ReflogParseOptions,
  ReflogParseResult,
  ReflogParseSummary,
} from "./types"

export const REFLOG_OPERATIONS = [
  "commit",
  "checkout",
  "reset",
  "merge",
  "rebase",
  "cherry-pick",
  "pull",
  "branch",
  "other",
] as const satisfies readonly ReflogOperation[]

const REFLOG_LINE_RE =
  /^([0-9a-f]{7,40})\s+(\S+)@\{(\d+)\}:\s+(.+)$/i

function emptyByOperation(): Record<ReflogOperation, number> {
  return {
    commit: 0,
    checkout: 0,
    reset: 0,
    merge: 0,
    rebase: 0,
    "cherry-pick": 0,
    pull: 0,
    branch: 0,
    other: 0,
  }
}

function shortHash(hash: string): string {
  return hash.slice(0, 7)
}

function classifyOperation(action: string): ReflogOperation {
  const lower = action.trim().toLowerCase()
  if (lower.startsWith("commit")) {
    return "commit"
  }
  if (lower === "checkout") {
    return "checkout"
  }
  if (lower === "reset") {
    return "reset"
  }
  if (lower.startsWith("merge")) {
    return "merge"
  }
  if (lower.startsWith("rebase")) {
    return "rebase"
  }
  if (lower.startsWith("cherry-pick")) {
    return "cherry-pick"
  }
  if (lower === "pull") {
    return "pull"
  }
  if (lower === "branch") {
    return "branch"
  }
  return "other"
}

function splitActionDescription(rest: string): {
  action: string
  description: string
} {
  const colon = rest.indexOf(": ")
  if (colon === -1) {
    return { action: rest.trim(), description: "" }
  }
  return {
    action: rest.slice(0, colon).trim(),
    description: rest.slice(colon + 2).trim(),
  }
}

function buildSummary(entries: ReflogEntry[]): ReflogParseSummary {
  const byOperation = emptyByOperation()
  for (const entry of entries) {
    byOperation[entry.operation]++
  }
  return {
    entryCount: entries.length,
    byOperation,
  }
}

export function reflogLocation(entry: ReflogEntry): string {
  return `${entry.refName}@{${entry.reflogIndex}}`
}

export function reflogResetCommand(entry: ReflogEntry): string {
  return `git reset --hard ${entry.refName}@{${entry.reflogIndex}}`
}

export function reflogCheckoutCommand(entry: ReflogEntry): string {
  return `git checkout ${entry.hash}`
}

/**
 * Parse pasted `git reflog` output into HEAD movement rows with recovery commands.
 */
export function parseReflogOutput(text: string): ReflogParseResult {
  const warnings: string[] = []
  const entries: ReflogEntry[] = []

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmed = line.trimEnd()
    if (!trimmed) {
      continue
    }

    const match = REFLOG_LINE_RE.exec(trimmed)
    if (!match) {
      continue
    }

    const hash = match[1]?.toLowerCase() ?? ""
    const refName = match[2] ?? ""
    const reflogIndex = Number.parseInt(match[3] ?? "", 10)
    const rest = match[4] ?? ""
    const { action, description } = splitActionDescription(rest)

    if (!hash || !Number.isFinite(reflogIndex)) {
      continue
    }

    entries.push({
      hash,
      shortHash: shortHash(hash),
      reflogIndex,
      refName,
      action,
      description,
      operation: classifyOperation(action),
      sourceLine: i + 1,
      raw: trimmed,
    })
  }

  if (!text.trim()) {
    warnings.push("Paste `git reflog` output to list recent HEAD movements.")
  } else if (entries.length === 0) {
    warnings.push(
      "No reflog rows found. Run `git reflog` and paste the full output.",
    )
  }

  return {
    entries,
    summary: buildSummary(entries),
    warnings,
  }
}

export function filterReflogEntries(
  entries: ReflogEntry[],
  options: ReflogParseOptions = {},
): ReflogEntry[] {
  const { operationFilter = "all" } = options
  if (operationFilter === "all") {
    return entries
  }
  return entries.filter((entry) => entry.operation === operationFilter)
}

export function formatReflogMarkdown(result: ReflogParseResult): string {
  if (result.entries.length === 0) {
    return "_No reflog entries found._"
  }

  const { summary } = result
  const lines = [
    `**${summary.entryCount}** reflog entry(ies)`,
    "",
    "| # | Operation | Hash | Description |",
    "|---|-----------|------|-------------|",
  ]

  for (const entry of result.entries) {
    const desc = entry.description || entry.action
    lines.push(
      `| ${entry.reflogIndex} | ${entry.operation} | \`${entry.shortHash}\` | ${desc.replace(/\|/g, "\\|")} |`,
    )
  }

  return lines.join("\n").trimEnd()
}

export function formatReflogHashes(result: ReflogParseResult): string {
  const seen = new Set<string>()
  const hashes: string[] = []
  for (const entry of result.entries) {
    if (!seen.has(entry.hash)) {
      seen.add(entry.hash)
      hashes.push(entry.hash)
    }
  }
  return hashes.join("\n")
}

export function formatReflogResetCommands(
  result: ReflogParseResult,
  options: ReflogParseOptions = {},
): string {
  const entries = filterReflogEntries(result.entries, options)
  return entries.map((entry) => reflogResetCommand(entry)).join("\n")
}

export function formatReflogCheckoutCommands(
  result: ReflogParseResult,
  options: ReflogParseOptions = {},
): string {
  const entries = filterReflogEntries(result.entries, options)
  const seen = new Set<string>()
  const commands: string[] = []
  for (const entry of entries) {
    if (!seen.has(entry.hash)) {
      seen.add(entry.hash)
      commands.push(reflogCheckoutCommand(entry))
    }
  }
  return commands.join("\n")
}
