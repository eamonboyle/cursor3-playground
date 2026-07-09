import type {
  ShortlogEntry,
  ShortlogFilter,
  ShortlogFormat,
  ShortlogParseOptions,
  ShortlogParseResult,
  ShortlogParseSummary,
} from "./types"

const NUMBERED_LINE_RE = /^\s*(\d+)\s+(.+)$/
const EMAIL_SUFFIX_RE = /^(.+?)\s*<([^>]+)>$/

function parseAuthorLine(rest: string): Pick<ShortlogEntry, "name" | "email"> {
  const emailMatch = EMAIL_SUFFIX_RE.exec(rest.trim())
  if (emailMatch) {
    return {
      name: emailMatch[1]?.trim() ?? rest.trim(),
      email: emailMatch[2]?.trim(),
    }
  }
  return { name: rest.trim() }
}

function buildSummary(entries: ShortlogEntry[]): ShortlogParseSummary {
  let totalCommits = 0
  let withEmail = 0
  let topAuthor: string | undefined
  let topCount = 0

  for (const entry of entries) {
    totalCommits += entry.count
    if (entry.email) {
      withEmail++
    }
    if (entry.count > topCount) {
      topCount = entry.count
      topAuthor = entry.name
    }
  }

  return {
    authors: entries.length,
    totalCommits,
    withEmail,
    topAuthor,
    topCount,
  }
}

function detectFormat(numbered: number, plain: number): ShortlogFormat {
  const kinds = [numbered, plain].filter((count) => count > 0)
  if (kinds.length === 0) {
    return "unknown"
  }
  if (kinds.length > 1) {
    return "mixed"
  }
  if (numbered > 0) {
    return "numbered"
  }
  return "plain"
}

/**
 * Parse pasted `git shortlog -sn`, `-sne`, or plain author list output.
 */
export function parseShortlogOutput(text: string): ShortlogParseResult {
  const warnings: string[] = []
  const entries: ShortlogEntry[] = []
  let numberedCount = 0
  let plainCount = 0

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const numberedMatch = NUMBERED_LINE_RE.exec(line)
    if (numberedMatch) {
      numberedCount++
      const count = Number(numberedMatch[1])
      const author = parseAuthorLine(numberedMatch[2] ?? "")
      entries.push({
        count,
        name: author.name,
        email: author.email,
        sourceLine: i + 1,
        raw: trimmed,
      })
      continue
    }

    const author = parseAuthorLine(trimmed)
    if (author.name) {
      plainCount++
      entries.push({
        count: 1,
        name: author.name,
        email: author.email,
        sourceLine: i + 1,
        raw: trimmed,
      })
    }
  }

  const sorted = [...entries].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  if (!text.trim()) {
    warnings.push(
      "Paste `git shortlog -sn` output — one row per author with commit counts.",
    )
  } else if (sorted.length === 0) {
    warnings.push(
      "No author rows found. Run `git shortlog -sn main..HEAD` and paste the output.",
    )
  }

  return {
    entries: sorted,
    summary: buildSummary(sorted),
    format: detectFormat(numberedCount, plainCount),
    warnings,
  }
}

export function filterShortlogEntries(
  entries: ShortlogEntry[],
  filter: ShortlogFilter = "all",
): ShortlogEntry[] {
  switch (filter) {
    case "all":
      return entries
    case "with-email":
      return entries.filter((entry) => Boolean(entry.email))
    case "without-email":
      return entries.filter((entry) => !entry.email)
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

export function shortlogNumberedCommand(range = "main..HEAD"): string {
  return `git shortlog -sn ${range}`
}

export function shortlogEmailCommand(range = "main..HEAD"): string {
  return `git shortlog -sne ${range}`
}

export function shortlogSinceTagCommand(tag: string): string {
  return `git shortlog -sn ${tag}..HEAD`
}

export function formatShortlogAuthors(
  result: ShortlogParseResult,
  options: ShortlogParseOptions = {},
): string {
  const entries = filterShortlogEntries(result.entries, options.filter ?? "all")
  return entries.map((entry) => entry.name).join("\n")
}

export function formatShortlogEmails(
  result: ShortlogParseResult,
  options: ShortlogParseOptions = {},
): string {
  const entries = filterShortlogEntries(result.entries, options.filter ?? "all")
  return entries
    .map((entry) => entry.email ?? entry.name)
    .join("\n")
}

export function formatShortlogAtMentions(
  result: ShortlogParseResult,
  options: ShortlogParseOptions = {},
): string {
  const entries = filterShortlogEntries(result.entries, options.filter ?? "all")
  return entries
    .map((entry) => {
      if (entry.email) {
        const local = entry.email.split("@")[0]
        return local ? `@${local}` : entry.name
      }
      return entry.name
    })
    .join("\n")
}

export function formatShortlogReleaseNotes(
  result: ShortlogParseResult,
  options: ShortlogParseOptions = {},
): string {
  const entries = filterShortlogEntries(result.entries, options.filter ?? "all")
  if (entries.length === 0) {
    return ""
  }

  const lines = ["## Contributors", ""]
  for (const entry of entries) {
    const label = entry.email ? `${entry.name} (${entry.email})` : entry.name
    lines.push(`- ${label} — ${entry.count} commit${entry.count === 1 ? "" : "s"}`)
  }
  return lines.join("\n").trimEnd()
}

export function formatShortlogMarkdown(result: ShortlogParseResult): string {
  if (result.entries.length === 0) {
    return "_No contributors found._"
  }

  const { summary } = result
  const lines = [
    `**${summary.authors}** author(s), **${summary.totalCommits}** commit(s) — top: ${summary.topAuthor ?? "—"} (${summary.topCount})`,
    "",
    "| Commits | Author | Email |",
    "|--------:|--------|-------|",
  ]

  for (const entry of result.entries) {
    const email = entry.email ?? "—"
    lines.push(`| ${entry.count} | ${entry.name} | ${email} |`)
  }

  return lines.join("\n").trimEnd()
}
