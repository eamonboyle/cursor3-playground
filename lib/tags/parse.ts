import type {
  TagEntry,
  TagFilter,
  TagKind,
  TagParseFormat,
  TagParseOptions,
  TagParseResult,
  TagParseSummary,
} from "./types"

const FORMAT_LINE_RE =
  /^(\S+)\s+([0-9a-f]{7,40})\s+(\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?)\s+(.+)$/i

const ANNOTATED_LINE_RE = /^(\S+)\s{2,}(.+)$/

const PLAIN_LINE_RE = /^(\S+)$/

const SEMVER_TAG_RE = /^v?\d+\.\d+\.\d+(?:[-+].*)?$/i

function isSemverTag(name: string): boolean {
  return SEMVER_TAG_RE.test(name)
}

function classifyKind(message: string | undefined, hash: string | undefined): TagKind {
  if (message?.trim() || hash) {
    return "annotated"
  }
  return "lightweight"
}

function buildSummary(entries: TagEntry[]): TagParseSummary {
  let annotated = 0
  let lightweight = 0
  let semver = 0

  for (const entry of entries) {
    if (entry.kind === "annotated") {
      annotated++
    } else {
      lightweight++
    }
    if (entry.isSemver) {
      semver++
    }
  }

  return {
    total: entries.length,
    annotated,
    lightweight,
    semver,
  }
}

function detectFormat(
  plainCount: number,
  annotatedCount: number,
  formatCount: number,
): TagParseFormat {
  const kinds = [plainCount, annotatedCount, formatCount].filter((count) => count > 0)
  if (kinds.length === 0) {
    return "unknown"
  }
  if (kinds.length > 1) {
    return "mixed"
  }
  if (formatCount > 0) {
    return "format"
  }
  if (annotatedCount > 0) {
    return "annotated"
  }
  return "plain"
}

/**
 * Parse pasted `git tag`, `git tag -l -n`, or custom `--format` output.
 */
export function parseTagOutput(text: string): TagParseResult {
  const warnings: string[] = []
  const entries: TagEntry[] = []
  let plainCount = 0
  let annotatedCount = 0
  let formatCount = 0

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmed = line.trimEnd()
    if (!trimmed) {
      continue
    }

    const formatMatch = FORMAT_LINE_RE.exec(trimmed)
    if (formatMatch) {
      formatCount++
      const name = formatMatch[1] ?? ""
      const hash = formatMatch[2]?.toLowerCase()
      const date = formatMatch[3]
      const message = formatMatch[4]?.trim()
      entries.push({
        name,
        hash,
        date,
        message,
        kind: classifyKind(message, hash),
        isSemver: isSemverTag(name),
        sourceLine: i + 1,
        raw: trimmed,
      })
      continue
    }

    const annotatedMatch = ANNOTATED_LINE_RE.exec(trimmed)
    if (annotatedMatch) {
      annotatedCount++
      const name = annotatedMatch[1] ?? ""
      const message = annotatedMatch[2]?.trim()
      entries.push({
        name,
        message,
        kind: classifyKind(message, undefined),
        isSemver: isSemverTag(name),
        sourceLine: i + 1,
        raw: trimmed,
      })
      continue
    }

    const plainMatch = PLAIN_LINE_RE.exec(trimmed)
    if (plainMatch) {
      plainCount++
      const name = plainMatch[1] ?? ""
      entries.push({
        name,
        kind: "lightweight",
        isSemver: isSemverTag(name),
        sourceLine: i + 1,
        raw: trimmed,
      })
    }
  }

  if (!text.trim()) {
    warnings.push(
      "Paste `git tag`, `git tag -l -n`, or `git tag --sort=-creatordate --format='%(refname:short) %(objectname:short) %(creatordate:short) %(subject)'` output.",
    )
  } else if (entries.length === 0) {
    warnings.push(
      "No tag rows found. Run `git tag -l -n` or `git tag` and paste the full output.",
    )
  }

  return {
    entries,
    summary: buildSummary(entries),
    format: detectFormat(plainCount, annotatedCount, formatCount),
    warnings,
  }
}

export function filterTagEntries(
  entries: TagEntry[],
  filter: TagFilter = "all",
): TagEntry[] {
  switch (filter) {
    case "all":
      return entries
    case "annotated":
      return entries.filter((entry) => entry.kind === "annotated")
    case "lightweight":
      return entries.filter((entry) => entry.kind === "lightweight")
    case "semver":
      return entries.filter((entry) => entry.isSemver)
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

export function tagCheckoutCommand(entry: TagEntry): string {
  return `git checkout tags/${entry.name}`
}

export function tagDeleteLocalCommand(entry: TagEntry): string {
  return `git tag -d ${entry.name}`
}

export function tagPushCommand(entry: TagEntry): string {
  return `git push origin ${entry.name}`
}

export function tagDeleteRemoteCommand(entry: TagEntry, remote = "origin"): string {
  return `git push ${remote} :refs/tags/${entry.name}`
}

export function tagShowCommand(entry: TagEntry): string {
  return `git show ${entry.name}`
}

export function formatTagNames(
  result: TagParseResult,
  options: TagParseOptions = {},
): string {
  const entries = filterTagEntries(result.entries, options.filter ?? "all")
  return entries.map((entry) => entry.name).join("\n")
}

export function formatTagCheckoutCommands(
  result: TagParseResult,
  options: TagParseOptions = {},
): string {
  const entries = filterTagEntries(result.entries, options.filter ?? "all")
  return entries.map((entry) => tagCheckoutCommand(entry)).join("\n")
}

export function formatTagDeleteCommands(
  result: TagParseResult,
  options: TagParseOptions = {},
): string {
  const entries = filterTagEntries(result.entries, options.filter ?? "all")
  const lines = entries.map((entry) => tagDeleteLocalCommand(entry))
  const remoteDeletes = entries.map((entry) => tagDeleteRemoteCommand(entry))
  if (entries.length === 0) {
    return ""
  }
  return [...lines, "", "# Delete from origin:", ...remoteDeletes].join("\n")
}

export function formatTagPushCommands(
  result: TagParseResult,
  options: TagParseOptions = {},
): string {
  const entries = filterTagEntries(result.entries, options.filter ?? "all")
  return entries.map((entry) => tagPushCommand(entry)).join("\n")
}

export function formatTagShowCommands(
  result: TagParseResult,
  options: TagParseOptions = {},
): string {
  const entries = filterTagEntries(result.entries, options.filter ?? "all")
  return entries.map((entry) => tagShowCommand(entry)).join("\n")
}

export function formatTagMarkdown(result: TagParseResult): string {
  if (result.entries.length === 0) {
    return "_No tags found._"
  }

  const { summary } = result
  const lines = [
    `**${summary.total}** tag(s) — ${summary.annotated} annotated, ${summary.lightweight} lightweight, ${summary.semver} semver`,
    "",
    "| Tag | Kind | Date | Message |",
    "|-----|------|------|---------|",
  ]

  for (const entry of result.entries) {
    const date = entry.date ?? "—"
    const message = entry.message ?? "—"
    lines.push(
      `| \`${entry.name}\` | ${entry.kind} | ${date} | ${message} |`,
    )
  }

  return lines.join("\n").trimEnd()
}
