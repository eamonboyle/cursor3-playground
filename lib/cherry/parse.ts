import type {
  CherryEntry,
  CherryFilter,
  CherryFormat,
  CherryParseOptions,
  CherryParseResult,
  CherryParseSummary,
  CherrySign,
} from "./types"

const CHERRY_LINE_RE = /^([+-])\s+([0-9a-f]+)(?:\s+(.+))?$/i

function shortHash(hash: string): string {
  return hash.length > 7 ? hash.slice(0, 7) : hash
}

function signFromChar(char: string): CherrySign {
  return char === "+" ? "unique" : "equivalent"
}

function buildSummary(entries: CherryEntry[]): CherryParseSummary {
  let unique = 0
  let equivalent = 0
  let hasSubjects = false

  for (const entry of entries) {
    if (entry.sign === "unique") {
      unique++
    } else {
      equivalent++
    }
    if (entry.subject) {
      hasSubjects = true
    }
  }

  return {
    total: entries.length,
    unique,
    equivalent,
    hasSubjects,
  }
}

function detectFormat(verbose: number, plain: number): CherryFormat {
  const kinds = [verbose, plain].filter((count) => count > 0)
  if (kinds.length === 0) {
    return "unknown"
  }
  if (kinds.length > 1) {
    return "mixed"
  }
  if (verbose > 0) {
    return "verbose"
  }
  return "plain"
}

/**
 * Parse pasted `git cherry` or `git cherry -v` output.
 */
export function parseCherryOutput(text: string): CherryParseResult {
  const warnings: string[] = []
  const entries: CherryEntry[] = []
  let verboseCount = 0
  let plainCount = 0

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const match = CHERRY_LINE_RE.exec(trimmed)
    if (!match) {
      continue
    }

    const signChar = match[1] ?? "+"
    const hash = match[2] ?? ""
    const subject = match[3]?.trim()

    if (subject) {
      verboseCount++
    } else {
      plainCount++
    }

    entries.push({
      sign: signFromChar(signChar),
      hash,
      shortHash: shortHash(hash),
      subject,
      sourceLine: i + 1,
      raw: trimmed,
    })
  }

  if (!text.trim()) {
    warnings.push(
      "Paste `git cherry -v origin/main` output — one + or − line per commit with hash and subject.",
    )
  } else if (entries.length === 0) {
    warnings.push(
      "No cherry rows found. Run `git cherry -v origin/main` and paste the full output.",
    )
  }

  return {
    entries,
    summary: buildSummary(entries),
    format: detectFormat(verboseCount, plainCount),
    warnings,
  }
}

export function filterCherryEntries(
  entries: CherryEntry[],
  filter: CherryFilter = "all",
): CherryEntry[] {
  switch (filter) {
    case "all":
      return entries
    case "unique":
      return entries.filter((entry) => entry.sign === "unique")
    case "equivalent":
      return entries.filter((entry) => entry.sign === "equivalent")
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

export function cherryCommand(upstream = "origin/main"): string {
  return `git cherry ${upstream}`
}

export function cherryVerboseCommand(upstream = "origin/main"): string {
  return `git cherry -v ${upstream}`
}

export function cherryPickRangeCommand(upstream = "origin/main"): string {
  return `git cherry-pick ${upstream}..HEAD`
}

export function showCommitCommand(hash: string): string {
  return `git show ${hash}`
}

export function formatCherryHashes(
  result: CherryParseResult,
  options: CherryParseOptions = {},
): string {
  const entries = filterCherryEntries(result.entries, options.filter ?? "all")
  return entries.map((entry) => entry.hash).join("\n")
}

export function formatCherryShortHashes(
  result: CherryParseResult,
  options: CherryParseOptions = {},
): string {
  const entries = filterCherryEntries(result.entries, options.filter ?? "all")
  return entries.map((entry) => entry.shortHash).join("\n")
}

export function formatCherrySubjects(
  result: CherryParseResult,
  options: CherryParseOptions = {},
): string {
  const entries = filterCherryEntries(result.entries, options.filter ?? "all")
  return entries
    .map((entry) => entry.subject ?? entry.shortHash)
    .join("\n")
}

export function formatCherryShowCommands(
  result: CherryParseResult,
  options: CherryParseOptions = {},
): string {
  const entries = filterCherryEntries(result.entries, options.filter ?? "all")
  return entries.map((entry) => showCommitCommand(entry.hash)).join("\n")
}

export function formatCherryLogRange(upstream = "origin/main"): string {
  return `git log --oneline ${upstream}..HEAD`
}

export function formatCherryRebaseHint(upstream = "origin/main"): string {
  return `git rebase -i ${upstream}`
}

export function formatCherryMarkdown(result: CherryParseResult): string {
  if (result.entries.length === 0) {
    return "_No cherry rows found._"
  }

  const { summary } = result
  const lines = [
    `**${summary.total}** commit(s) — **${summary.unique}** unique (+), **${summary.equivalent}** equivalent (−)`,
    "",
    "| Sign | Hash | Subject |",
    "|------|------|---------|",
  ]

  for (const entry of result.entries) {
    const sign = entry.sign === "unique" ? "+" : "−"
    const subject = entry.subject ?? "—"
    lines.push(`| ${sign} | \`${entry.shortHash}\` | ${subject} |`)
  }

  return lines.join("\n").trimEnd()
}
