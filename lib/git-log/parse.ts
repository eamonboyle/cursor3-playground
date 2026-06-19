import type {
  GitLogCommitType,
  GitLogEntry,
  GitLogParseOptions,
  GitLogParseResult,
} from "./types"

const COMMIT_TYPES: readonly GitLogCommitType[] = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
] as const

const COMMIT_HEADER_RE = /^commit\s+([0-9a-f]{7,40})\b/i
const ONELINE_RE =
  /^([0-9a-f]{7,40})\s+(?:\([^)]*\)\s+)?(.+)$/
const CONVENTIONAL_RE = /^([a-z]+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/i
const MERGE_SUBJECT_RE = /^merge\b/i

function isCommitType(value: string): value is GitLogCommitType {
  return (COMMIT_TYPES as readonly string[]).includes(value)
}

function shortHash(hash: string): string {
  return hash.slice(0, 7)
}

function isMergeSubject(subject: string): boolean {
  return MERGE_SUBJECT_RE.test(subject.trim())
}

function parseConventionalSubject(subject: string): {
  type?: GitLogCommitType | "other"
  scope?: string
  breaking: boolean
  normalizedSubject: string
} {
  const match = CONVENTIONAL_RE.exec(subject.trim())
  if (!match) {
    return { breaking: false, normalizedSubject: subject.trim() }
  }

  const typeRaw = match[1]?.toLowerCase() ?? ""
  const scope = match[2]?.trim()
  const breaking = Boolean(match[3])
  const normalizedSubject = match[4]?.trim() ?? subject.trim()
  const type = isCommitType(typeRaw) ? typeRaw : "other"

  return {
    type,
    scope: scope || undefined,
    breaking,
    normalizedSubject,
  }
}

function buildEntry(
  hash: string,
  subject: string,
  sourceLine: number,
  raw: string,
): GitLogEntry {
  const isMerge = isMergeSubject(subject)
  const conventional = parseConventionalSubject(subject)

  return {
    hash,
    shortHash: shortHash(hash),
    subject: conventional.normalizedSubject,
    type: isMerge ? undefined : conventional.type,
    scope: conventional.scope,
    breaking: conventional.breaking,
    isMerge,
    sourceLine,
    raw,
  }
}

function matchesTypeFilter(
  entry: GitLogEntry,
  typeFilter?: string,
): boolean {
  if (!typeFilter?.trim()) {
    return true
  }
  const normalized = typeFilter.trim().toLowerCase()
  if (normalized === "merge") {
    return entry.isMerge
  }
  if (normalized === "breaking") {
    return entry.breaking
  }
  return entry.type === normalized
}

function buildSummary(commits: GitLogEntry[]): GitLogParseResult["summary"] {
  const byType: Record<string, number> = {}
  let breakingCount = 0
  let mergeCount = 0

  for (const entry of commits) {
    if (entry.isMerge) {
      mergeCount++
      byType.merge = (byType.merge ?? 0) + 1
      continue
    }
    if (entry.breaking) {
      breakingCount++
    }
    const key = entry.type ?? "other"
    byType[key] = (byType[key] ?? 0) + 1
  }

  return {
    commitCount: commits.length,
    byType,
    breakingCount,
    mergeCount,
  }
}

function parseOnelineLines(text: string): GitLogEntry[] {
  const commits: GitLogEntry[] = []
  const lines = text.split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const match = ONELINE_RE.exec(trimmed)
    if (!match) {
      continue
    }

    const hash = match[1] ?? ""
    const subject = match[2] ?? ""
    commits.push(buildEntry(hash, subject, i + 1, trimmed))
  }

  return commits
}

function parseFullLogBlocks(text: string): GitLogEntry[] {
  const commits: GitLogEntry[] = []
  const lines = text.split(/\r?\n/)
  let i = 0

  while (i < lines.length) {
    const line = lines[i] ?? ""
    const header = COMMIT_HEADER_RE.exec(line.trim())
    if (!header) {
      i++
      continue
    }

    const hash = header[1] ?? ""
    i++

    while (i < lines.length) {
      const current = lines[i] ?? ""
      if (COMMIT_HEADER_RE.test(current.trim())) {
        break
      }

      const subject = current.trim()
      if (
        subject &&
        !/^author:/i.test(subject) &&
        !/^date:/i.test(subject) &&
        !/^merge:/i.test(subject) &&
        !/^signed-off-by:/i.test(subject)
      ) {
        commits.push(buildEntry(hash, subject, i + 1, subject))
        break
      }

      i++
    }
  }

  return commits
}

function applyFilters(
  commits: GitLogEntry[],
  options: GitLogParseOptions,
): { commits: GitLogEntry[]; skipped: number } {
  let skipped = 0
  const filtered = commits.filter((entry) => {
    if (options.hideMerges && entry.isMerge) {
      skipped++
      return false
    }
    if (!matchesTypeFilter(entry, options.typeFilter)) {
      skipped++
      return false
    }
    return true
  })
  return { commits: filtered, skipped }
}

/**
 * Parse pasted `git log --oneline`, decorated oneline, or full commit blocks.
 */
export function parseGitLogOutput(
  text: string,
  options: GitLogParseOptions = {},
): GitLogParseResult {
  const warnings: string[] = []
  const trimmed = text.trim()

  if (!trimmed) {
    return {
      commits: [],
      summary: {
        commitCount: 0,
        byType: {},
        breakingCount: 0,
        mergeCount: 0,
      },
      warnings: [
        "Paste output from `git log --oneline`, `git log --pretty=format:%h %s`, or full `git log`.",
      ],
    }
  }

  const hasCommitHeaders = /^\s*commit\s+[0-9a-f]{7,40}\b/im.test(trimmed)
  const rawCommits = hasCommitHeaders
    ? parseFullLogBlocks(trimmed)
    : parseOnelineLines(trimmed)

  const { commits, skipped } = applyFilters(rawCommits, options)
  const summary = buildSummary(commits)

  if (rawCommits.length === 0) {
    warnings.push(
      "No commits found. Use `git log --oneline` or paste full commit blocks with `commit <hash>` headers.",
    )
  } else {
    if (skipped > 0) {
      warnings.push(`Filtered ${skipped} commit(s) by current options.`)
    }
    if (hasCommitHeaders) {
      warnings.push("Parsed full git log blocks (commit / Author / Date / subject).")
    } else {
      warnings.push("Parsed oneline-style log lines.")
    }
    if (summary.breakingCount > 0) {
      warnings.push(
        `${summary.breakingCount} breaking change(s) detected via \`!\` in the subject.`,
      )
    }
  }

  return { commits, summary, warnings }
}

export function formatGitLogSubjects(result: GitLogParseResult): string {
  return result.commits.map((entry) => entry.subject).join("\n")
}

export function formatGitLogHashes(result: GitLogParseResult): string {
  return result.commits.map((entry) => entry.shortHash).join("\n")
}

const RELEASE_SECTION_ORDER: Array<GitLogCommitType | "other"> = [
  "feat",
  "fix",
  "perf",
  "refactor",
  "docs",
  "test",
  "build",
  "ci",
  "chore",
  "style",
  "revert",
  "other",
]

const RELEASE_SECTION_LABELS: Record<string, string> = {
  feat: "Features",
  fix: "Bug fixes",
  perf: "Performance",
  refactor: "Refactors",
  docs: "Documentation",
  test: "Tests",
  build: "Build",
  ci: "CI",
  chore: "Chores",
  style: "Style",
  revert: "Reverts",
  other: "Other",
}

export function formatGitLogReleaseNotes(result: GitLogParseResult): string {
  if (result.commits.length === 0) {
    return "_No commits to summarize._"
  }

  const grouped = new Map<string, GitLogEntry[]>()
  const breaking: GitLogEntry[] = []

  for (const entry of result.commits) {
    if (entry.isMerge) {
      continue
    }
    if (entry.breaking) {
      breaking.push(entry)
    }
    const key = entry.type ?? "other"
    const list = grouped.get(key) ?? []
    list.push(entry)
    grouped.set(key, list)
  }

  const lines: string[] = []

  if (breaking.length > 0) {
    lines.push("### Breaking changes", "")
    for (const entry of breaking) {
      const scope = entry.scope ? `**${entry.scope}:** ` : ""
      lines.push(`- ${scope}${entry.subject} (\`${entry.shortHash}\`)`)
    }
    lines.push("")
  }

  for (const type of RELEASE_SECTION_ORDER) {
    const entries = grouped.get(type)
    if (!entries?.length) {
      continue
    }
    const label = RELEASE_SECTION_LABELS[type] ?? type
    lines.push(`### ${label}`, "")
    for (const entry of entries) {
      const scope = entry.scope ? `**${entry.scope}:** ` : ""
      const bang = entry.breaking ? " ⚠️" : ""
      lines.push(`- ${scope}${entry.subject}${bang} (\`${entry.shortHash}\`)`)
    }
    lines.push("")
  }

  return lines.join("\n").trimEnd()
}

export function formatGitLogMarkdown(result: GitLogParseResult): string {
  if (result.commits.length === 0) {
    return "_No commits found._"
  }

  const { summary } = result
  const typeParts = Object.entries(summary.byType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${type}: ${count}`)

  const lines = [
    `**${summary.commitCount}** commit(s)`,
    summary.breakingCount
      ? `Breaking — ${summary.breakingCount}`
      : "",
    summary.mergeCount ? `Merges — ${summary.mergeCount}` : "",
    typeParts.length ? `Types — ${typeParts.join(", ")}` : "",
    "",
    ...result.commits.map((entry) => {
      const type = entry.isMerge ? "merge" : (entry.type ?? "other")
      const scope = entry.scope ? `(${entry.scope}) ` : ""
      const bang = entry.breaking ? "!" : ""
      return `- \`${entry.shortHash}\` **${type}** ${scope}${entry.subject}${bang}`
    }),
  ].filter(Boolean)

  return lines.join("\n").trimEnd()
}
