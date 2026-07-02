import type {
  StashEntry,
  StashKind,
  StashListParseResult,
  StashListSummary,
} from "./types"

const STASH_LINE_RE = /^stash@\{(\d+)\}:\s*(.+)$/

const STASH_KINDS: readonly StashKind[] = [
  "wip",
  "on",
  "untracked",
  "autostash",
  "unknown",
] as const

const WIP_RE = /^WIP on (.+?):\s*(?:[0-9a-f]{7,40}\s+)?(.*)$/i
const ON_RE = /^On (.+?):\s*(.*)$/i
const UNTRACKED_RE =
  /^untracked files on (.+?):\s*(?:[0-9a-f]{7,40}\s+)?(.*)$/i
const AUTOSTASH_RE = /^autostash:\s*(.*)$/i

function emptyByKind(): Record<StashKind, number> {
  return {
    wip: 0,
    on: 0,
    untracked: 0,
    autostash: 0,
    unknown: 0,
  }
}

function buildSummary(entries: StashEntry[]): StashListSummary {
  const byKind = emptyByKind()
  for (const entry of entries) {
    byKind[entry.kind]++
  }
  return {
    total: entries.length,
    byKind,
  }
}

function parseStashMessage(
  rest: string,
): Pick<StashEntry, "kind" | "branch" | "message"> {
  const wip = WIP_RE.exec(rest)
  if (wip) {
    return {
      kind: "wip",
      branch: wip[1]?.trim(),
      message: wip[2]?.trim() ?? "",
    }
  }

  const untracked = UNTRACKED_RE.exec(rest)
  if (untracked) {
    return {
      kind: "untracked",
      branch: untracked[1]?.trim(),
      message: untracked[2]?.trim() ?? "",
    }
  }

  const autostash = AUTOSTASH_RE.exec(rest)
  if (autostash) {
    return {
      kind: "autostash",
      message: autostash[1]?.trim() ?? "",
    }
  }

  const on = ON_RE.exec(rest)
  if (on) {
    return {
      kind: "on",
      branch: on[1]?.trim(),
      message: on[2]?.trim() ?? "",
    }
  }

  return {
    kind: "unknown",
    message: rest.trim(),
  }
}

/**
 * Parse pasted `git stash list` output into stash rows with refs and messages.
 */
export function parseStashList(text: string): StashListParseResult {
  const warnings: string[] = []
  const entries: StashEntry[] = []

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmed = line.trimEnd()
    if (!trimmed) {
      continue
    }

    const match = STASH_LINE_RE.exec(trimmed)
    if (!match) {
      continue
    }

    const index = Number(match[1])
    const rest = match[2] ?? ""
    const parsed = parseStashMessage(rest)

    entries.push({
      index,
      ref: `stash@{${index}}`,
      sourceLine: i + 1,
      raw: trimmed,
      ...parsed,
    })
  }

  if (!text.trim()) {
    warnings.push(
      "Paste `git stash list` output to enumerate saved stashes.",
    )
  } else if (entries.length === 0) {
    warnings.push(
      "No stash rows found. Run `git stash list` and paste the full output.",
    )
  }

  return {
    entries,
    summary: buildSummary(entries),
    warnings,
  }
}

export function formatStashRefs(result: StashListParseResult): string {
  return result.entries.map((entry) => entry.ref).join("\n")
}

export function formatStashMarkdown(result: StashListParseResult): string {
  if (result.entries.length === 0) {
    return "_No stashes found._"
  }

  const lines = [
    `**${result.summary.total}** stash(es)`,
    "",
    "| Ref | Kind | Branch | Message |",
    "| --- | --- | --- | --- |",
  ]

  for (const entry of result.entries) {
    lines.push(
      `| \`${entry.ref}\` | ${entry.kind} | ${entry.branch ? `\`${entry.branch}\`` : "—"} | ${entry.message || "—"} |`,
    )
  }

  return lines.join("\n").trimEnd()
}

export function formatStashApplyCommands(
  result: StashListParseResult,
  mode: "apply" | "pop" = "apply",
): string {
  if (result.entries.length === 0) {
    return ""
  }
  const verb = mode === "pop" ? "pop" : "apply"
  return result.entries.map((entry) => `git stash ${verb} ${entry.ref}`).join("\n")
}

export function formatStashShowCommands(result: StashListParseResult): string {
  if (result.entries.length === 0) {
    return ""
  }
  return result.entries
    .map((entry) => `git stash show --name-status ${entry.ref}`)
    .join("\n")
}

export function formatStashPatchCommands(result: StashListParseResult): string {
  if (result.entries.length === 0) {
    return ""
  }
  return result.entries
    .map((entry) => `git stash show -p ${entry.ref}`)
    .join("\n")
}

export { STASH_KINDS }
