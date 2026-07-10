import type {
  WorktreeEntry,
  WorktreeFilter,
  WorktreeFormat,
  WorktreeParseOptions,
  WorktreeParseResult,
  WorktreeParseSummary,
  WorktreeState,
} from "./types"

const LIST_LINE_RE =
  /^(\S+)\s+(?:(\S+)\s+)?(?:\[([^\]]+)\]|\(([^)]+)\))(?:\s+(locked|prunable))?$/i

function shortHash(hash: string): string {
  return hash.length > 7 ? hash.slice(0, 7) : hash
}

function branchFromRef(ref: string): string {
  const branchMatch = /^refs\/heads\/(.+)$/.exec(ref.trim())
  return branchMatch?.[1]?.trim() ?? ref.trim()
}

function stateFromListParen(
  paren: string | undefined,
  suffix: string | undefined,
): WorktreeState {
  if (suffix === "locked") {
    return "locked"
  }
  if (suffix === "prunable") {
    return "prunable"
  }
  if (!paren) {
    return "normal"
  }
  const lower = paren.toLowerCase()
  if (lower === "bare") {
    return "bare"
  }
  if (lower.startsWith("detached")) {
    return "detached"
  }
  if (lower === "prunable") {
    return "prunable"
  }
  if (lower === "locked") {
    return "locked"
  }
  return "normal"
}

function stateFromPorcelainFlags(
  bare: boolean,
  detached: boolean,
  locked: boolean,
  prunable: boolean,
): WorktreeState {
  if (bare) {
    return "bare"
  }
  if (locked) {
    return "locked"
  }
  if (prunable) {
    return "prunable"
  }
  if (detached) {
    return "detached"
  }
  return "normal"
}

function buildSummary(entries: WorktreeEntry[]): WorktreeParseSummary {
  const summary: WorktreeParseSummary = {
    total: entries.length,
    normal: 0,
    bare: 0,
    detached: 0,
    locked: 0,
    prunable: 0,
  }

  for (const entry of entries) {
    summary[entry.state]++
    if (entry.isMain) {
      summary.mainPath = entry.path
    }
  }

  if (!summary.mainPath && entries[0]) {
    summary.mainPath = entries[0].path
  }

  return summary
}

function detectFormat(listCount: number, porcelainCount: number): WorktreeFormat {
  const kinds = [listCount, porcelainCount].filter((count) => count > 0)
  if (kinds.length === 0) {
    return "unknown"
  }
  if (kinds.length > 1) {
    return "mixed"
  }
  if (listCount > 0) {
    return "list"
  }
  return "porcelain"
}

function parseListLine(line: string, sourceLine: number): WorktreeEntry | null {
  const trimmed = line.trim()
  if (!trimmed) {
    return null
  }

  const match = LIST_LINE_RE.exec(trimmed)
  if (!match) {
    return null
  }

  const path = match[1] ?? ""
  const hash = match[2]
  const branch = match[3]
  const paren = match[4]
  const suffix = match[5]?.toLowerCase()

  const state = branch
    ? suffix === "locked"
      ? "locked"
      : suffix === "prunable"
        ? "prunable"
        : "normal"
    : stateFromListParen(paren, suffix)

  return {
    path,
    shortHash: hash ? shortHash(hash) : undefined,
    branch: branch?.trim(),
    state,
    sourceLine,
    raw: trimmed,
  }
}

type PorcelainBlock = {
  path?: string
  head?: string
  branch?: string
  bare?: boolean
  detached?: boolean
  locked?: boolean
  prunable?: boolean
  sourceLine: number
}

function flushPorcelainBlock(block: PorcelainBlock, rawLines: string[]): WorktreeEntry | null {
  if (!block.path) {
    return null
  }

  const state = stateFromPorcelainFlags(
    Boolean(block.bare),
    Boolean(block.detached),
    Boolean(block.locked),
    Boolean(block.prunable),
  )

  return {
    path: block.path,
    shortHash: block.head ? shortHash(block.head) : undefined,
    branch: block.branch ? branchFromRef(block.branch) : undefined,
    ref: block.branch,
    state,
    sourceLine: block.sourceLine,
    raw: rawLines.join("\n"),
  }
}

function parsePorcelain(text: string): WorktreeEntry[] {
  const entries: WorktreeEntry[] = []
  const lines = text.split(/\r?\n/)
  let block: PorcelainBlock | null = null
  let rawLines: string[] = []

  function finishBlock() {
    if (!block) {
      return
    }
    const entry = flushPorcelainBlock(block, rawLines)
    if (entry) {
      entries.push(entry)
    }
    block = null
    rawLines = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmed = line.trim()

    if (!trimmed) {
      finishBlock()
      continue
    }

    if (trimmed.startsWith("worktree ")) {
      finishBlock()
      block = { path: trimmed.slice("worktree ".length).trim(), sourceLine: i + 1 }
      rawLines = [trimmed]
      continue
    }

    if (!block) {
      continue
    }

    rawLines.push(trimmed)

    if (trimmed.startsWith("HEAD ")) {
      block.head = trimmed.slice("HEAD ".length).trim()
      continue
    }
    if (trimmed.startsWith("branch ")) {
      block.branch = trimmed.slice("branch ".length).trim()
      continue
    }
    if (trimmed === "bare") {
      block.bare = true
      continue
    }
    if (trimmed === "detached") {
      block.detached = true
      continue
    }
    if (trimmed === "locked") {
      block.locked = true
      continue
    }
    if (trimmed === "prunable") {
      block.prunable = true
    }
  }

  finishBlock()
  return entries
}

function markMainWorktree(entries: WorktreeEntry[]): WorktreeEntry[] {
  if (entries.length === 0) {
    return entries
  }

  const mainCandidate =
    entries.find((entry) => entry.state === "normal" && entry.branch === "main") ??
    entries.find((entry) => entry.state === "normal" && !entry.path.includes("-")) ??
    entries[0]

  return entries.map((entry) => ({
    ...entry,
    isMain: entry.path === mainCandidate?.path,
  }))
}

/**
 * Parse pasted `git worktree list` or `git worktree list --porcelain` output.
 */
export function parseWorktreeOutput(text: string): WorktreeParseResult {
  const warnings: string[] = []
  let listCount = 0
  let porcelainCount = 0

  const trimmed = text.trim()
  if (!trimmed) {
    return {
      entries: [],
      summary: buildSummary([]),
      format: "unknown",
      warnings: [
        "Paste `git worktree list` output — one row per linked checkout with path, HEAD, and branch.",
      ],
    }
  }

  const hasPorcelain = /^worktree /m.test(trimmed)
  let entries: WorktreeEntry[] = []

  if (hasPorcelain) {
    porcelainCount = 1
    entries = parsePorcelain(trimmed)
  } else {
    const lines = text.split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      const entry = parseListLine(lines[i] ?? "", i + 1)
      if (entry) {
        listCount++
        entries.push(entry)
      }
    }
  }

  entries = markMainWorktree(entries)

  if (entries.length === 0) {
    warnings.push(
      "No worktree rows found. Run `git worktree list` and paste the full output.",
    )
  }

  return {
    entries,
    summary: buildSummary(entries),
    format: detectFormat(listCount, porcelainCount),
    warnings,
  }
}

export function filterWorktreeEntries(
  entries: WorktreeEntry[],
  filter: WorktreeFilter = "all",
): WorktreeEntry[] {
  switch (filter) {
    case "all":
      return entries
    case "normal":
    case "bare":
    case "detached":
    case "locked":
    case "prunable":
      return entries.filter((entry) => entry.state === filter)
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

export function worktreeListCommand(): string {
  return "git worktree list"
}

export function worktreeListPorcelainCommand(): string {
  return "git worktree list --porcelain"
}

export function worktreeAddCommand(path: string, branch: string): string {
  return `git worktree add ${path} ${branch}`
}

export function worktreeRemoveCommand(path: string, force = false): string {
  return force ? `git worktree remove --force ${path}` : `git worktree remove ${path}`
}

export function worktreePruneCommand(): string {
  return "git worktree prune"
}

export function worktreeUnlockCommand(path: string): string {
  return `git worktree unlock ${path}`
}

export function worktreeLockCommand(path: string, reason?: string): string {
  return reason
    ? `git worktree lock --reason "${reason}" ${path}`
    : `git worktree lock ${path}`
}

export function formatWorktreePaths(
  result: WorktreeParseResult,
  options: WorktreeParseOptions = {},
): string {
  const entries = filterWorktreeEntries(result.entries, options.filter ?? "all")
  return entries.map((entry) => entry.path).join("\n")
}

export function formatWorktreeBranches(
  result: WorktreeParseResult,
  options: WorktreeParseOptions = {},
): string {
  const entries = filterWorktreeEntries(result.entries, options.filter ?? "all")
  return entries
    .map((entry) => entry.branch)
    .filter((branch): branch is string => Boolean(branch))
    .join("\n")
}

export function formatWorktreeRemoveCommands(
  result: WorktreeParseResult,
  options: WorktreeParseOptions = {},
): string {
  const entries = filterWorktreeEntries(result.entries, options.filter ?? "all")
  return entries
    .filter((entry) => !entry.isMain && entry.state !== "bare")
    .map((entry) => worktreeRemoveCommand(entry.path))
    .join("\n")
}

export function formatWorktreePruneCommands(result: WorktreeParseResult): string {
  const prunable = result.entries.filter((entry) => entry.state === "prunable")
  if (prunable.length === 0) {
    return worktreePruneCommand()
  }
  return [worktreePruneCommand(), ...prunable.map((entry) => worktreeRemoveCommand(entry.path))].join(
    "\n",
  )
}

export function formatWorktreeUnlockCommands(result: WorktreeParseResult): string {
  return result.entries
    .filter((entry) => entry.state === "locked")
    .map((entry) => worktreeUnlockCommand(entry.path))
    .join("\n")
}

export function formatWorktreeMarkdown(result: WorktreeParseResult): string {
  if (result.entries.length === 0) {
    return "_No worktrees found._"
  }

  const { summary } = result
  const lines = [
    `**${summary.total}** worktree(s) — ${summary.normal} linked, ${summary.detached} detached, ${summary.locked} locked, ${summary.prunable} prunable`,
    "",
    "| Path | Branch | HEAD | State |",
    "|------|--------|------|-------|",
  ]

  for (const entry of result.entries) {
    const branch = entry.branch ?? "—"
    const hash = entry.shortHash ?? "—"
    const main = entry.isMain ? " (main)" : ""
    lines.push(
      `| \`${entry.path}\`${main} | ${branch} | \`${hash}\` | ${entry.state} |`,
    )
  }

  return lines.join("\n").trimEnd()
}
