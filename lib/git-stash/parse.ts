import type {
  GitStashEntry,
  GitStashKind,
  GitStashParseResult,
  GitStashSummary,
} from "./types"

const STASH_LINE_RE = /^stash@\{(\d+)\}:\s*(.+)$/
const WIP_ON_RE = /^WIP on (.+?):\s*([0-9a-f]{7,40})\s*(.*)$/i
const ON_BRANCH_RE = /^On (.+?):\s*([0-9a-f]{7,40})\s*(.*)$/i

function buildSummary(entries: GitStashEntry[]): GitStashSummary {
  let wip = 0
  let on = 0
  let custom = 0

  for (const entry of entries) {
    if (entry.kind === "wip") {
      wip++
    } else if (entry.kind === "on") {
      on++
    } else {
      custom++
    }
  }

  return {
    total: entries.length,
    wip,
    on,
    custom,
  }
}

function parseStashBody(
  index: number,
  body: string,
  sourceLine: number,
  raw: string,
): GitStashEntry {
  const ref = `stash@{${index}}`

  const wip = WIP_ON_RE.exec(body)
  if (wip) {
    return {
      index,
      ref,
      kind: "wip",
      branch: wip[1]?.trim(),
      commit: wip[2]?.trim(),
      message: wip[3]?.trim() || "(no message)",
      sourceLine,
      raw,
    }
  }

  const onBranch = ON_BRANCH_RE.exec(body)
  if (onBranch) {
    return {
      index,
      ref,
      kind: "on",
      branch: onBranch[1]?.trim(),
      commit: onBranch[2]?.trim(),
      message: onBranch[3]?.trim() || "(no message)",
      sourceLine,
      raw,
    }
  }

  return {
    index,
    ref,
    kind: "custom",
    message: body.trim() || "(no message)",
    sourceLine,
    raw,
  }
}

/**
 * Parse pasted `git stash list` output into structured stash rows.
 */
export function parseGitStashList(text: string): GitStashParseResult {
  const warnings: string[] = []
  const entries: GitStashEntry[] = []
  let unparsedLines = 0

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const match = STASH_LINE_RE.exec(trimmed)
    if (!match) {
      unparsedLines++
      continue
    }

    const index = Number.parseInt(match[1] ?? "", 10)
    const body = match[2] ?? ""
    if (Number.isNaN(index)) {
      unparsedLines++
      continue
    }

    entries.push(parseStashBody(index, body, i + 1, trimmed))
  }

  entries.sort((a, b) => a.index - b.index)

  if (!text.trim()) {
    warnings.push(
      "Paste `git stash list` output to inspect saved stashes and copy apply or show commands.",
    )
  } else if (entries.length === 0) {
    warnings.push(
      "No stash rows found. Run `git stash list` and paste the full output.",
    )
  } else if (unparsedLines > 0) {
    warnings.push(
      `${unparsedLines} line(s) did not match stash@{n}: format and were skipped.`,
    )
  }

  return {
    entries,
    summary: buildSummary(entries),
    warnings,
  }
}

export function filterGitStashEntries(
  entries: GitStashEntry[],
  kind: GitStashKind | "all",
): GitStashEntry[] {
  if (kind === "all") {
    return entries
  }
  return entries.filter((e) => e.kind === kind)
}

export function formatStashShowCommands(
  entries: GitStashEntry[],
): string {
  if (entries.length === 0) {
    return ""
  }
  return entries.map((e) => `git stash show -p ${e.ref}`).join("\n")
}

export function formatStashApplyCommands(
  entries: GitStashEntry[],
): string {
  if (entries.length === 0) {
    return ""
  }
  return entries.map((e) => `git stash apply ${e.ref}`).join("\n")
}

export function formatStashPopCommands(entries: GitStashEntry[]): string {
  if (entries.length === 0) {
    return ""
  }
  return entries.map((e) => `git stash pop ${e.ref}`).join("\n")
}

export function formatStashDropCommands(entries: GitStashEntry[]): string {
  if (entries.length === 0) {
    return ""
  }
  return entries.map((e) => `git stash drop ${e.ref}`).join("\n")
}

export function formatStashRefs(entries: GitStashEntry[]): string {
  return entries.map((e) => e.ref).join("\n")
}

export function formatStashMarkdown(result: GitStashParseResult): string {
  if (result.entries.length === 0) {
    return "_No stashes found._"
  }

  const lines = [
    `**${result.summary.total}** stash(es) — WIP: ${result.summary.wip}, On: ${result.summary.on}, custom: ${result.summary.custom}`,
    "",
  ]

  for (const entry of result.entries) {
    const branch = entry.branch ? ` on \`${entry.branch}\`` : ""
    const commit = entry.commit ? ` (\`${entry.commit}\`)` : ""
    lines.push(
      `- **${entry.ref}**${branch}${commit}: ${entry.message}`,
    )
  }

  return lines.join("\n").trimEnd()
}
