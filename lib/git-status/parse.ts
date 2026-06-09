import type {
  GitFileKind,
  GitStatusBucket,
  GitStatusEntry,
  GitStatusParseResult,
  GitStatusSummary,
} from "./types"

const PORCELAIN_LINE_RE =
  /^([ MADRCU?!])([ MADRCU?!]) (.+)$/

const PORCELAIN_RENAME_RE = /^(.+?) -> (.+)$/

const HUMAN_SECTION_RE =
  /^(Changes to be committed|Changes not staged for commit|Untracked files|Ignored files|Unmerged paths):/i

const HUMAN_LINE_RE =
  /^\s*(new file|modified|deleted|renamed|copied|typechange|unmerged):\s+(.+)$/i

const HUMAN_RENAME_RE = /^(.+?) -> (.+)$/

const BRANCH_RE = /^On branch (.+)$/
const PORCELAIN_BRANCH_RE = /^## (.+?)(?:\.\.\.|$)/

const GIT_FILE_KINDS: readonly GitFileKind[] = [
  "added",
  "modified",
  "deleted",
  "renamed",
  "copied",
  "untracked",
  "ignored",
  "conflicted",
] as const

function emptyByKind(): Record<GitFileKind, number> {
  return {
    added: 0,
    modified: 0,
    deleted: 0,
    renamed: 0,
    copied: 0,
    untracked: 0,
    ignored: 0,
    conflicted: 0,
  }
}

function kindFromCodes(index: string, worktree: string): GitFileKind {
  if (index === "?" && worktree === "?") {
    return "untracked"
  }
  if (index === "!" && worktree === "!") {
    return "ignored"
  }
  if (index === "U" || worktree === "U") {
    return "conflicted"
  }
  if (index === "A" || worktree === "A") {
    return "added"
  }
  if (index === "D" || worktree === "D") {
    return "deleted"
  }
  if (index === "R" || worktree === "R") {
    return "renamed"
  }
  if (index === "C" || worktree === "C") {
    return "copied"
  }
  return "modified"
}

function bucketsFromCodes(index: string, worktree: string): GitStatusBucket[] {
  const buckets: GitStatusBucket[] = []
  if (index === "?" && worktree === "?") {
    return ["untracked"]
  }
  if (index === "!" && worktree === "!") {
    return ["ignored"]
  }
  if (index === "U" || worktree === "U") {
    return ["conflicted"]
  }
  if (index !== " " && index !== "?") {
    buckets.push("staged")
  }
  if (worktree !== " " && worktree !== "?") {
    buckets.push("unstaged")
  }
  return buckets
}

function kindFromHumanLabel(label: string): GitFileKind {
  const lower = label.toLowerCase()
  if (lower === "new file") {
    return "added"
  }
  if (lower === "deleted") {
    return "deleted"
  }
  if (lower === "renamed") {
    return "renamed"
  }
  if (lower === "copied") {
    return "copied"
  }
  if (lower === "unmerged") {
    return "conflicted"
  }
  return "modified"
}

function bucketFromHumanSection(section: string): GitStatusBucket {
  const lower = section.toLowerCase()
  if (lower.startsWith("changes to be committed")) {
    return "staged"
  }
  if (lower.startsWith("changes not staged")) {
    return "unstaged"
  }
  if (lower.startsWith("untracked")) {
    return "untracked"
  }
  if (lower.startsWith("ignored")) {
    return "ignored"
  }
  return "conflicted"
}

function mergeEntry(
  map: Map<string, GitStatusEntry>,
  entry: GitStatusEntry,
): void {
  const key = entry.oldPath
    ? `${entry.oldPath} -> ${entry.path}`
    : entry.path
  const existing = map.get(key)
  if (!existing) {
    map.set(key, entry)
    return
  }
  const buckets = new Set([...existing.buckets, ...entry.buckets])
  existing.buckets = [...buckets]
  if (!existing.indexCode && entry.indexCode) {
    existing.indexCode = entry.indexCode
  }
  if (!existing.worktreeCode && entry.worktreeCode) {
    existing.worktreeCode = entry.worktreeCode
  }
}

function parsePorcelainLine(
  line: string,
  sourceLine: number,
): GitStatusEntry | undefined {
  const trimmed = line.trimEnd()
  if (!trimmed || trimmed.startsWith("#")) {
    return undefined
  }

  const match = PORCELAIN_LINE_RE.exec(trimmed)
  if (!match) {
    return undefined
  }

  const index = match[1] ?? " "
  const worktree = match[2] ?? " "
  const rest = match[3] ?? ""
  const kind = kindFromCodes(index, worktree)
  const buckets = bucketsFromCodes(index, worktree)

  let path = rest.trim()
  let oldPath: string | undefined

  const rename = PORCELAIN_RENAME_RE.exec(rest)
  if (rename) {
    oldPath = rename[1]?.trim()
    path = rename[2]?.trim() ?? path
  }

  if (!path) {
    return undefined
  }

  return {
    path,
    oldPath,
    kind,
    buckets,
    indexCode: index,
    worktreeCode: worktree,
    sourceLine,
    raw: trimmed,
  }
}

function parseHumanLine(
  line: string,
  section: GitStatusBucket,
  sourceLine: number,
): GitStatusEntry | undefined {
  const trimmed = line.trimEnd()
  if (!trimmed) {
    return undefined
  }

  const labeled = HUMAN_LINE_RE.exec(trimmed)
  if (labeled) {
    const label = labeled[1] ?? ""
    const rest = labeled[2]?.trim() ?? ""
    const kind = kindFromHumanLabel(label)
    let path = rest
    let oldPath: string | undefined

    const rename = HUMAN_RENAME_RE.exec(rest)
    if (rename) {
      oldPath = rename[1]?.trim()
      path = rename[2]?.trim() ?? path
    }

    if (!path) {
      return undefined
    }

    return {
      path,
      oldPath,
      kind,
      buckets: [section],
      sourceLine,
      raw: trimmed,
    }
  }

  if (
    section === "untracked" ||
    section === "ignored" ||
    section === "conflicted"
  ) {
    const path = trimmed.trim()
    if (!path || path.startsWith("(")) {
      return undefined
    }
    return {
      path,
      kind:
        section === "untracked"
          ? "untracked"
          : section === "ignored"
            ? "ignored"
            : "conflicted",
      buckets: [section],
      sourceLine,
      raw: trimmed,
    }
  }

  return undefined
}

function buildSummary(entries: GitStatusEntry[]): GitStatusSummary {
  const byKind = emptyByKind()
  let staged = 0
  let unstaged = 0
  let untracked = 0
  let ignored = 0
  let conflicted = 0

  for (const entry of entries) {
    byKind[entry.kind]++
    if (entry.buckets.includes("staged")) {
      staged++
    }
    if (entry.buckets.includes("unstaged")) {
      unstaged++
    }
    if (entry.buckets.includes("untracked")) {
      untracked++
    }
    if (entry.buckets.includes("ignored")) {
      ignored++
    }
    if (entry.buckets.includes("conflicted")) {
      conflicted++
    }
  }

  return {
    total: entries.length,
    staged,
    unstaged,
    untracked,
    ignored,
    conflicted,
    byKind,
  }
}

export function entryDisplayPath(entry: GitStatusEntry): string {
  if (entry.oldPath) {
    return `${entry.oldPath} -> ${entry.path}`
  }
  return entry.path
}

/**
 * Parse pasted `git status` or `git status --porcelain` output into grouped file rows.
 */
export function parseGitStatus(text: string): GitStatusParseResult {
  const warnings: string[] = []
  const map = new Map<string, GitStatusEntry>()
  let branch: string | undefined
  let porcelainHits = 0
  let humanHits = 0
  let humanSection: GitStatusBucket | undefined

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const sourceLine = i + 1

    const branchHuman = BRANCH_RE.exec(line.trim())
    if (branchHuman) {
      branch = branchHuman[1]?.trim()
      continue
    }

    const branchPorcelain = PORCELAIN_BRANCH_RE.exec(line.trim())
    if (branchPorcelain) {
      branch = branchPorcelain[1]?.trim()
      continue
    }

    const section = HUMAN_SECTION_RE.exec(line.trim())
    if (section) {
      humanSection = bucketFromHumanSection(section[1] ?? "")
      continue
    }

    const fromPorcelain = parsePorcelainLine(line, sourceLine)
    if (fromPorcelain) {
      porcelainHits++
      mergeEntry(map, fromPorcelain)
      continue
    }

    if (humanSection) {
      const fromHuman = parseHumanLine(line, humanSection, sourceLine)
      if (fromHuman) {
        humanHits++
        mergeEntry(map, fromHuman)
      }
    }
  }

  const entries = [...map.values()]

  let format: GitStatusParseResult["format"] = "unknown"
  if (porcelainHits > 0 && humanHits > 0) {
    format = "mixed"
  } else if (porcelainHits > 0) {
    format = "porcelain"
  } else if (humanHits > 0) {
    format = "human"
  }

  if (!text.trim()) {
    warnings.push(
      "Paste `git status` or `git status --porcelain` output to list changed files.",
    )
  } else if (entries.length === 0) {
    warnings.push(
      "No file rows found. Try `git status --porcelain` for the most reliable parse.",
    )
  }

  return {
    entries,
    summary: buildSummary(entries),
    branch,
    format,
    warnings,
  }
}

export function filterGitStatusEntries(
  entries: GitStatusEntry[],
  bucket: GitStatusBucket | "all",
): GitStatusEntry[] {
  if (bucket === "all") {
    return entries
  }
  return entries.filter((e) => e.buckets.includes(bucket))
}

export function formatGitStatusMarkdown(result: GitStatusParseResult): string {
  if (result.entries.length === 0) {
    return "_No changed files found._"
  }

  const { summary } = result
  const lines = [
    `**${summary.total}** file(s) — staged: ${summary.staged}, unstaged: ${summary.unstaged}, untracked: ${summary.untracked}`,
    "",
  ]

  if (result.branch) {
    lines.unshift(`Branch: \`${result.branch}\``, "")
  }

  const sections: { bucket: GitStatusBucket; title: string }[] = [
    { bucket: "staged", title: "Staged" },
    { bucket: "unstaged", title: "Unstaged" },
    { bucket: "untracked", title: "Untracked" },
    { bucket: "conflicted", title: "Conflicted" },
    { bucket: "ignored", title: "Ignored" },
  ]

  for (const { bucket, title } of sections) {
    const group = filterGitStatusEntries(result.entries, bucket)
    if (group.length === 0) {
      continue
    }
    lines.push(`### ${title}`, "")
    for (const entry of group) {
      lines.push(`- **${entry.kind}** \`${entryDisplayPath(entry)}\``)
    }
    lines.push("")
  }

  return lines.join("\n").trimEnd()
}

export function formatGitStatusPaths(
  result: GitStatusParseResult,
  bucket: GitStatusBucket | "all" = "all",
): string {
  const entries = filterGitStatusEntries(result.entries, bucket)
  const seen = new Set<string>()
  const paths: string[] = []
  for (const entry of entries) {
    const path = entryDisplayPath(entry)
    if (!seen.has(path)) {
      seen.add(path)
      paths.push(path)
    }
  }
  return paths.join("\n")
}

export function formatGitAddCommands(
  result: GitStatusParseResult,
  bucket: GitStatusBucket | "all" = "all",
): string {
  const entries = filterGitStatusEntries(result.entries, bucket)
  if (entries.length === 0) {
    return ""
  }
  return entries.map((e) => `git add ${JSON.stringify(e.path)}`).join("\n")
}

export { GIT_FILE_KINDS }
