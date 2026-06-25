import type {
  StashEntry,
  StashKind,
  StashParseResult,
  StashSummary,
} from "./types"

const STASH_LINE_RE = /^stash@\{(\d+)\}:\s*(.+)$/

const WIP_ON_RE =
  /^WIP on (.+?):\s+([0-9a-f]{7,40})\s+(.+)$/i
const ON_BRANCH_RE =
  /^On (.+?):\s+([0-9a-f]{7,40})\s+(.+)$/i
const UNTRACKED_RE =
  /^untracked files on (.+?):\s+([0-9a-f]{7,40})\s+(.+)$/i

function emptyByKind(): Record<StashKind, number> {
  return { wip: 0, branch: 0, untracked: 0, custom: 0 }
}

function parseStashBody(
  body: string,
): Pick<StashEntry, "kind" | "branch" | "commit" | "message"> {
  const wip = WIP_ON_RE.exec(body)
  if (wip) {
    return {
      kind: "wip",
      branch: wip[1]?.trim(),
      commit: wip[2],
      message: wip[3]?.trim() ?? "",
    }
  }

  const untracked = UNTRACKED_RE.exec(body)
  if (untracked) {
    return {
      kind: "untracked",
      branch: untracked[1]?.trim(),
      commit: untracked[2],
      message: untracked[3]?.trim() ?? "",
    }
  }

  const onBranch = ON_BRANCH_RE.exec(body)
  if (onBranch) {
    return {
      kind: "branch",
      branch: onBranch[1]?.trim(),
      commit: onBranch[2],
      message: onBranch[3]?.trim() ?? "",
    }
  }

  return {
    kind: "custom",
    message: body.trim(),
  }
}

function buildSummary(entries: StashEntry[]): StashSummary {
  const byKind = emptyByKind()
  const branchSet = new Set<string>()

  for (const entry of entries) {
    byKind[entry.kind]++
    if (entry.branch && entry.branch !== "(no branch)") {
      branchSet.add(entry.branch)
    }
  }

  return {
    total: entries.length,
    byKind,
    branches: [...branchSet].sort((a, b) => a.localeCompare(b)),
  }
}

function parseStashLine(line: string, sourceLine: number): StashEntry | undefined {
  const trimmed = line.trimEnd()
  if (!trimmed) {
    return undefined
  }

  const match = STASH_LINE_RE.exec(trimmed)
  if (!match) {
    return undefined
  }

  const index = Number(match[1])
  const body = match[2] ?? ""
  if (Number.isNaN(index)) {
    return undefined
  }

  const parsed = parseStashBody(body)

  return {
    index,
    ref: `stash@{${index}}`,
    sourceLine,
    raw: trimmed,
    ...parsed,
  }
}

/**
 * Parse pasted `git stash list` output into indexed stash entries.
 */
export function parseStashList(text: string): StashParseResult {
  const warnings: string[] = []
  const entries: StashEntry[] = []
  const lines = text.split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const entry = parseStashLine(lines[i] ?? "", i + 1)
    if (entry) {
      entries.push(entry)
    }
  }

  entries.sort((a, b) => a.index - b.index)

  if (!text.trim()) {
    warnings.push("Paste `git stash list` output to preview stash entries.")
  } else if (entries.length === 0) {
    warnings.push(
      "No stash entries found. Try: git stash list",
    )
  }

  return {
    entries,
    summary: buildSummary(entries),
    warnings,
  }
}

export function stashDisplayTitle(entry: StashEntry): string {
  if (entry.message) {
    return entry.message
  }
  if (entry.branch) {
    return entry.branch
  }
  return entry.ref
}

export function formatStashMarkdown(result: StashParseResult): string {
  if (result.entries.length === 0) {
    return "_No stash entries found._"
  }

  const kindParts = (["wip", "branch", "untracked", "custom"] as const)
    .filter((kind) => result.summary.byKind[kind] > 0)
    .map((kind) => `${kind}: ${result.summary.byKind[kind]}`)

  const lines = [
    `**${result.summary.total}** stash(es) — ${kindParts.join(", ")}`,
    "",
  ]

  for (const entry of result.entries) {
    const branch = entry.branch ? ` on \`${entry.branch}\`` : ""
    const commit = entry.commit ? ` (${entry.commit.slice(0, 7)})` : ""
    lines.push(
      `- **${entry.ref}**${branch}${commit} — ${stashDisplayTitle(entry)}`,
    )
  }

  return lines.join("\n")
}

export function formatStashCommand(
  result: StashParseResult,
  command: "apply" | "pop" | "show" | "drop",
): string {
  if (result.entries.length === 0) {
    return ""
  }

  return result.entries
    .map((entry) => `git stash ${command} ${entry.ref}`)
    .join("\n")
}

export function formatStashRefs(result: StashParseResult): string {
  return result.entries.map((entry) => entry.ref).join("\n")
}
