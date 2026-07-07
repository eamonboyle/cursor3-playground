import type {
  DescribeEntry,
  DescribeFilter,
  DescribeKind,
  DescribeParseOptions,
  DescribeParseResult,
  DescribeParseSummary,
} from "./types"

const LONG_DESCRIBE_RE = /^(.+)-(\d+)-g([0-9a-f]{7,40})$/i
const SHORT_DESCRIBE_RE = /^(.+)-(\d+)$/
const HASH_ONLY_RE = /^[0-9a-f]{7,40}$/i
const SEMVER_TAG_RE = /^v?\d+\.\d+\.\d+(?:[-+].*)?$/i

function isSemverTag(name: string): boolean {
  return SEMVER_TAG_RE.test(name)
}

function classifyExactTag(tag: string): DescribeKind {
  if (HASH_ONLY_RE.test(tag)) {
    return "hash-only"
  }
  return "exact-tag"
}

function buildSummary(entries: DescribeEntry[]): DescribeParseSummary {
  let exactTag = 0
  let aheadOfTag = 0
  let hashOnly = 0
  let semver = 0

  for (const entry of entries) {
    switch (entry.kind) {
      case "exact-tag":
        exactTag++
        break
      case "ahead-of-tag":
        aheadOfTag++
        break
      case "hash-only":
        hashOnly++
        break
      case "unknown":
        break
      default: {
        const _exhaustive: never = entry.kind
        return _exhaustive
      }
    }
    if (entry.isSemverTag) {
      semver++
    }
  }

  return {
    total: entries.length,
    exactTag,
    aheadOfTag,
    hashOnly,
    semver,
  }
}

function parseDescribeLine(line: string, sourceLine: number): DescribeEntry {
  const trimmed = line.trim()
  if (!trimmed) {
    return {
      raw: trimmed,
      kind: "unknown",
      isSemverTag: false,
      sourceLine,
    }
  }

  const longMatch = LONG_DESCRIBE_RE.exec(trimmed)
  if (longMatch) {
    const tag = longMatch[1] ?? ""
    const commitsAhead = Number(longMatch[2])
    const hash = longMatch[3]?.toLowerCase()
    return {
      raw: trimmed,
      kind: "ahead-of-tag",
      tag,
      commitsAhead,
      hash,
      isSemverTag: isSemverTag(tag),
      sourceLine,
    }
  }

  const shortMatch = SHORT_DESCRIBE_RE.exec(trimmed)
  if (shortMatch) {
    const tag = shortMatch[1] ?? ""
    const commitsAhead = Number(shortMatch[2])
    return {
      raw: trimmed,
      kind: "ahead-of-tag",
      tag,
      commitsAhead,
      isSemverTag: isSemverTag(tag),
      sourceLine,
    }
  }

  if (HASH_ONLY_RE.test(trimmed)) {
    return {
      raw: trimmed,
      kind: "hash-only",
      hash: trimmed.toLowerCase(),
      isSemverTag: false,
      sourceLine,
    }
  }

  return {
    raw: trimmed,
    kind: classifyExactTag(trimmed),
    tag: trimmed,
    isSemverTag: isSemverTag(trimmed),
    sourceLine,
  }
}

/**
 * Parse pasted `git describe --tags`, `--long`, or `--always` output.
 */
export function parseDescribeOutput(text: string): DescribeParseResult {
  const warnings: string[] = []
  const entries: DescribeEntry[] = []

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }
    entries.push(parseDescribeLine(trimmed, i + 1))
  }

  if (!text.trim()) {
    warnings.push(
      "Paste `git describe --tags --long --always` output — one line per ref or HEAD.",
    )
  } else if (entries.length === 0) {
    warnings.push(
      "No describe lines found. Run `git describe --tags --long --always` and paste the output.",
    )
  }

  return {
    entries,
    summary: buildSummary(entries),
    warnings,
  }
}

export function filterDescribeEntries(
  entries: DescribeEntry[],
  filter: DescribeFilter = "all",
): DescribeEntry[] {
  switch (filter) {
    case "all":
      return entries
    case "exact-tag":
      return entries.filter((entry) => entry.kind === "exact-tag")
    case "ahead-of-tag":
      return entries.filter((entry) => entry.kind === "ahead-of-tag")
    case "hash-only":
      return entries.filter((entry) => entry.kind === "hash-only")
    case "unknown":
      return entries.filter((entry) => entry.kind === "unknown")
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

export function describeLongCommand(ref = "HEAD"): string {
  return `git describe --tags --long --always ${ref}`
}

export function describeTagsCommand(ref = "HEAD"): string {
  return `git describe --tags ${ref}`
}

export function checkoutTagCommand(entry: DescribeEntry): string {
  if (!entry.tag) {
    return ""
  }
  return `git checkout tags/${entry.tag}`
}

export function checkoutHashCommand(entry: DescribeEntry): string {
  if (!entry.hash) {
    return ""
  }
  return `git checkout ${entry.hash}`
}

export function formatDescribeLines(
  result: DescribeParseResult,
  options: DescribeParseOptions = {},
): string {
  const entries = filterDescribeEntries(result.entries, options.filter ?? "all")
  return entries.map((entry) => entry.raw).join("\n")
}

export function formatDescribeLongCommands(
  result: DescribeParseResult,
  options: DescribeParseOptions = {},
): string {
  const entries = filterDescribeEntries(result.entries, options.filter ?? "all")
  return entries.map(() => describeLongCommand()).join("\n")
}

export function formatCheckoutTagCommands(
  result: DescribeParseResult,
  options: DescribeParseOptions = {},
): string {
  const entries = filterDescribeEntries(
    result.entries,
    options.filter ?? "all",
  ).filter((entry) => entry.tag && entry.kind !== "hash-only")
  return entries.map((entry) => checkoutTagCommand(entry)).join("\n")
}

export function formatCheckoutHashCommands(
  result: DescribeParseResult,
  options: DescribeParseOptions = {},
): string {
  const entries = filterDescribeEntries(
    result.entries,
    options.filter ?? "all",
  ).filter((entry) => entry.hash)
  return entries.map((entry) => checkoutHashCommand(entry)).join("\n")
}

export function formatDescribeMarkdown(result: DescribeParseResult): string {
  if (result.entries.length === 0) {
    return "_No describe lines found._"
  }

  const { summary } = result
  const lines = [
    `**${summary.total}** describe line(s) — ${summary.exactTag} exact tag, ${summary.aheadOfTag} ahead of tag, ${summary.hashOnly} hash-only, ${summary.semver} semver`,
    "",
    "| Describe | Kind | Tag | Ahead | Hash |",
    "|----------|------|-----|-------|------|",
  ]

  for (const entry of result.entries) {
    const tag = entry.tag ?? "—"
    const ahead =
      entry.commitsAhead === undefined ? "—" : String(entry.commitsAhead)
    const hash = entry.hash ?? "—"
    lines.push(
      `| \`${entry.raw}\` | ${entry.kind} | ${tag} | ${ahead} | ${hash} |`,
    )
  }

  return lines.join("\n").trimEnd()
}
