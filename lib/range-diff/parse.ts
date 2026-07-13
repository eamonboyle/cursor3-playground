import type {
  RangeDiffComparison,
  RangeDiffComparisonSymbol,
  RangeDiffEntry,
  RangeDiffFilter,
  RangeDiffParseOptions,
  RangeDiffParseResult,
  RangeDiffParseSummary,
  RangeDiffSide,
} from "./types"

/** Gitaly-style commit pair line — see git-range-diff(1) examples. */
const COMMIT_PAIR_RE =
  /^(-|(\d+)):\s+(-+|([0-9a-f]+))\s+([=!<>])\s+(-|(\d+)):\s+(-+|([0-9a-f]+))\s*(.*)$/i

function shortHash(hash: string): string {
  return hash.length > 7 ? hash.slice(0, 7) : hash
}

function comparisonFromSymbol(
  symbol: RangeDiffComparisonSymbol,
): RangeDiffComparison {
  switch (symbol) {
    case "=":
      return "equal"
    case "!":
      return "modified"
    case "<":
      return "removed"
    case ">":
      return "added"
    default: {
      const _exhaustive: never = symbol
      return _exhaustive
    }
  }
}

function parseSide(
  positionToken: string,
  positionGroup: string | undefined,
  hashToken: string,
  hashGroup: string | undefined,
): RangeDiffSide {
  const placeholder = hashToken.startsWith("-")
  const position =
    positionToken === "-" ? undefined : Number(positionGroup ?? positionToken)
  const hash = placeholder ? undefined : (hashGroup ?? hashToken).toLowerCase()

  return {
    position: Number.isFinite(position) ? position : undefined,
    hash,
    shortHash: hash ? shortHash(hash) : undefined,
    placeholder,
  }
}

function buildSummary(entries: RangeDiffEntry[]): RangeDiffParseSummary {
  let equal = 0
  let modified = 0
  let added = 0
  let removed = 0
  let withPatch = 0

  for (const entry of entries) {
    switch (entry.comparison) {
      case "equal":
        equal++
        break
      case "modified":
        modified++
        break
      case "added":
        added++
        break
      case "removed":
        removed++
        break
      default: {
        const _exhaustive: never = entry.comparison
        return _exhaustive
      }
    }
    if (entry.hasPatch) {
      withPatch++
    }
  }

  return {
    total: entries.length,
    equal,
    modified,
    added,
    removed,
    withPatch,
  }
}

function isPatchLine(line: string): boolean {
  return /^\s{2,}/.test(line)
}

function isCommitPairLine(line: string): boolean {
  return COMMIT_PAIR_RE.test(line.trim())
}

/**
 * Parse pasted `git range-diff` output — commit pair headers and optional patch bodies.
 */
export function parseRangeDiffOutput(text: string): RangeDiffParseResult {
  const warnings: string[] = []
  const entries: RangeDiffEntry[] = []
  const lines = text.split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const match = COMMIT_PAIR_RE.exec(trimmed)
    if (!match) {
      continue
    }

    const leftPositionToken = match[1] ?? "-"
    const leftPositionGroup = match[2]
    const leftHashToken = match[3] ?? "-------"
    const leftHashGroup = match[4]
    const comparisonSymbol = (match[5] ?? "=") as RangeDiffComparisonSymbol
    const rightPositionToken = match[6] ?? "-"
    const rightPositionGroup = match[7]
    const rightHashToken = match[8] ?? "-------"
    const rightHashGroup = match[9]
    const subject = (match[10] ?? "").trim()

    let patchLines = 0
    let hasPatch = false

    if (comparisonSymbol === "!") {
      let j = i + 1
      while (j < lines.length) {
        const nextLine = lines[j] ?? ""
        if (!nextLine.trim()) {
          j++
          continue
        }
        if (isCommitPairLine(nextLine)) {
          break
        }
        if (isPatchLine(nextLine)) {
          hasPatch = true
          patchLines++
          j++
          continue
        }
        break
      }
    }

    entries.push({
      comparison: comparisonFromSymbol(comparisonSymbol),
      comparisonSymbol,
      left: parseSide(
        leftPositionToken,
        leftPositionGroup,
        leftHashToken,
        leftHashGroup,
      ),
      right: parseSide(
        rightPositionToken,
        rightPositionGroup,
        rightHashToken,
        rightHashGroup,
      ),
      subject,
      sourceLine: i + 1,
      raw: trimmed,
      hasPatch,
      patchLines,
    })
  }

  if (!text.trim()) {
    warnings.push(
      "Paste `git range-diff @{u} @{1} @` output — one commit pair line per row with =, !, <, or >.",
    )
  } else if (entries.length === 0) {
    warnings.push(
      "No range-diff rows found. Run `git range-diff origin/main...topic` after a rebase and paste the full output.",
    )
  }

  return {
    entries,
    summary: buildSummary(entries),
    warnings,
  }
}

export function filterRangeDiffEntries(
  entries: RangeDiffEntry[],
  filter: RangeDiffFilter = "all",
): RangeDiffEntry[] {
  switch (filter) {
    case "all":
      return entries
    case "equal":
      return entries.filter((entry) => entry.comparison === "equal")
    case "modified":
      return entries.filter((entry) => entry.comparison === "modified")
    case "added":
      return entries.filter((entry) => entry.comparison === "added")
    case "removed":
      return entries.filter((entry) => entry.comparison === "removed")
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

export function rangeDiffCommand(
  leftRange = "origin/main...topic@{1}",
  rightRange = "origin/main...topic",
): string {
  return `git range-diff ${leftRange} ${rightRange}`
}

export function rangeDiffReflogCommand(): string {
  return "git range-diff @{u} @{1} @"
}

export function showCommitCommand(hash: string): string {
  return `git show ${hash}`
}

export function formatRangeDiffHashes(
  result: RangeDiffParseResult,
  options: RangeDiffParseOptions = {},
): string {
  const entries = filterRangeDiffEntries(result.entries, options.filter ?? "all")
  const hashes: string[] = []

  for (const entry of entries) {
    if (entry.left.hash) {
      hashes.push(entry.left.hash)
    }
    if (entry.right.hash) {
      hashes.push(entry.right.hash)
    }
  }

  return [...new Set(hashes)].join("\n")
}

export function formatRangeDiffNewHashes(
  result: RangeDiffParseResult,
  options: RangeDiffParseOptions = {},
): string {
  const entries = filterRangeDiffEntries(result.entries, options.filter ?? "all")
  return entries
    .map((entry) => entry.right.hash)
    .filter((hash): hash is string => Boolean(hash))
    .join("\n")
}

export function formatRangeDiffShowCommands(
  result: RangeDiffParseResult,
  options: RangeDiffParseOptions = {},
): string {
  const entries = filterRangeDiffEntries(result.entries, options.filter ?? "all")
  const commands: string[] = []

  for (const entry of entries) {
    if (entry.left.hash) {
      commands.push(showCommitCommand(entry.left.hash))
    }
    if (entry.right.hash) {
      commands.push(showCommitCommand(entry.right.hash))
    }
  }

  return [...new Set(commands)].join("\n")
}

export function formatRangeDiffSubjects(
  result: RangeDiffParseResult,
  options: RangeDiffParseOptions = {},
): string {
  const entries = filterRangeDiffEntries(result.entries, options.filter ?? "all")
  return entries
    .map((entry) => entry.subject || entry.raw)
    .join("\n")
}

export function formatRangeDiffMarkdown(result: RangeDiffParseResult): string {
  if (result.entries.length === 0) {
    return "_No range-diff rows found._"
  }

  const { summary } = result
  const lines = [
    `**${summary.total}** commit pair(s) — **${summary.equal}** equal (=), **${summary.modified}** modified (!), **${summary.added}** added (>), **${summary.removed}** removed (<)`,
    "",
    "| Cmp | Left | Right | Subject |",
    "|-----|------|-------|---------|",
  ]

  for (const entry of result.entries) {
    const left = entry.left.shortHash ?? "—"
    const right = entry.right.shortHash ?? "—"
    const subject = entry.subject || "—"
    const patch = entry.hasPatch ? " (patch)" : ""
    lines.push(
      `| ${entry.comparisonSymbol}${patch} | \`${left}\` | \`${right}\` | ${subject} |`,
    )
  }

  return lines.join("\n").trimEnd()
}
