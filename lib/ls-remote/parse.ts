import type {
  LsRemoteEntry,
  LsRemoteFilter,
  LsRemoteParseOptions,
  LsRemoteParseResult,
  LsRemoteParseSummary,
  LsRemoteRefKind,
} from "./types"

const LINE_RE = /^([0-9a-f]{7,40})\s+(\S+)$/i
const SEMVER_TAG_RE = /^v?\d+\.\d+\.\d+(?:[-+].*)?$/i

function shortHash(hash: string): string {
  return hash.length > 7 ? hash.slice(0, 7) : hash
}

function isSemverTag(name: string): boolean {
  return SEMVER_TAG_RE.test(name)
}

function nameFromRef(ref: string): string {
  if (ref === "HEAD") {
    return "HEAD"
  }
  if (ref.startsWith("refs/heads/")) {
    return ref.slice("refs/heads/".length)
  }
  if (ref.startsWith("refs/tags/")) {
    const tagRef = ref.slice("refs/tags/".length)
    return tagRef.endsWith("^{}") ? tagRef.slice(0, -3) : tagRef
  }
  if (ref.startsWith("refs/")) {
    return ref.slice("refs/".length)
  }
  return ref
}

function kindFromRef(ref: string): LsRemoteRefKind {
  if (ref === "HEAD") {
    return "head"
  }
  if (ref.startsWith("refs/heads/")) {
    return "branch"
  }
  if (ref.startsWith("refs/tags/")) {
    return ref.endsWith("^{}") ? "tag-peeled" : "tag"
  }
  return "other"
}

function buildSummary(entries: LsRemoteEntry[]): LsRemoteParseSummary {
  const summary: LsRemoteParseSummary = {
    total: entries.length,
    branches: 0,
    tags: 0,
    peeled: 0,
    semverTags: 0,
  }

  const peeledByTag = new Map<string, string>()
  for (const entry of entries) {
    if (entry.kind === "tag-peeled") {
      peeledByTag.set(entry.name, entry.hash)
    }
  }

  for (const entry of entries) {
    switch (entry.kind) {
      case "head":
        summary.headHash = entry.hash
        break
      case "branch":
        summary.branches++
        if (summary.headHash && entry.hash === summary.headHash) {
          summary.defaultBranch = entry.name
        }
        break
      case "tag":
        summary.tags++
        if (entry.isSemver) {
          summary.semverTags++
        }
        if (peeledByTag.has(entry.name)) {
          summary.peeled++
        }
        break
      case "tag-peeled":
        break
      case "other":
        break
      default: {
        const _exhaustive: never = entry.kind
        return _exhaustive
      }
    }
  }

  return summary
}

function linkAnnotatedTags(entries: LsRemoteEntry[]): LsRemoteEntry[] {
  const peeledByTag = new Map<string, string>()
  for (const entry of entries) {
    if (entry.kind === "tag-peeled") {
      peeledByTag.set(entry.name, entry.hash)
    }
  }

  return entries.map((entry) => {
    if (entry.kind !== "tag") {
      return entry
    }
    const peeledHash = peeledByTag.get(entry.name)
    if (!peeledHash) {
      return entry
    }
    return {
      ...entry,
      isAnnotatedTag: true,
      peeledHash,
    }
  })
}

/**
 * Parse pasted `git ls-remote` output — hash and ref pairs from a remote.
 */
export function parseLsRemoteOutput(text: string): LsRemoteParseResult {
  const warnings: string[] = []
  const entries: LsRemoteEntry[] = []

  const trimmed = text.trim()
  if (!trimmed) {
    return {
      entries: [],
      summary: buildSummary([]),
      warnings: [
        "Paste `git ls-remote origin` output — one hash and ref per line, tab-separated.",
      ],
    }
  }

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const trimmedLine = line.trim()
    if (!trimmedLine) {
      continue
    }

    const match = LINE_RE.exec(trimmedLine)
    if (!match) {
      warnings.push(`Line ${i + 1}: could not parse hash/ref pair.`)
      continue
    }

    const hash = (match[1] ?? "").toLowerCase()
    const ref = match[2] ?? ""
    const name = nameFromRef(ref)
    const kind = kindFromRef(ref)

    entries.push({
      hash,
      shortHash: shortHash(hash),
      ref,
      name,
      kind,
      isSemver: kind === "tag" && isSemverTag(name),
      sourceLine: i + 1,
      raw: trimmedLine,
    })
  }

  const linked = linkAnnotatedTags(entries)

  if (linked.length === 0) {
    warnings.push(
      "No remote refs found. Run `git ls-remote origin` and paste the full output.",
    )
  }

  return {
    entries: linked,
    summary: buildSummary(linked),
    warnings,
  }
}

export function filterLsRemoteEntries(
  entries: LsRemoteEntry[],
  filter: LsRemoteFilter = "all",
): LsRemoteEntry[] {
  switch (filter) {
    case "all":
      return entries
    case "branches":
      return entries.filter((entry) => entry.kind === "branch")
    case "tags":
      return entries.filter(
        (entry) => entry.kind === "tag" || entry.kind === "tag-peeled",
      )
    case "head":
      return entries.filter((entry) => entry.kind === "head")
    case "other":
      return entries.filter((entry) => entry.kind === "other")
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

export function lsRemoteCommand(remote = "origin"): string {
  return `git ls-remote ${remote}`
}

export function lsRemoteHeadsCommand(remote = "origin"): string {
  return `git ls-remote --heads ${remote}`
}

export function lsRemoteTagsCommand(remote = "origin"): string {
  return `git ls-remote --tags ${remote}`
}

export function fetchBranchCommand(remote: string, branch: string): string {
  return `git fetch ${remote} ${branch}`
}

export function checkoutTrackingCommand(
  branch: string,
  remote = "origin",
): string {
  return `git checkout --track ${remote}/${branch}`
}

export function checkoutTagCommand(tag: string): string {
  return `git checkout tags/${tag}`
}

export function formatLsRemoteBranchNames(
  result: LsRemoteParseResult,
  options: LsRemoteParseOptions = {},
): string {
  return filterLsRemoteEntries(result.entries, options.filter ?? "branches")
    .map((entry) => entry.name)
    .join("\n")
}

export function formatLsRemoteTagNames(
  result: LsRemoteParseResult,
  options: LsRemoteParseOptions = {},
): string {
  return filterLsRemoteEntries(result.entries, options.filter ?? "tags")
    .filter((entry) => entry.kind === "tag")
    .map((entry) => entry.name)
    .join("\n")
}

export function formatLsRemoteFetchCommands(
  result: LsRemoteParseResult,
  remote = "origin",
  options: LsRemoteParseOptions = {},
): string {
  return filterLsRemoteEntries(result.entries, options.filter ?? "branches")
    .map((entry) => fetchBranchCommand(remote, entry.name))
    .join("\n")
}

export function formatLsRemoteCheckoutCommands(
  result: LsRemoteParseResult,
  remote = "origin",
  options: LsRemoteParseOptions = {},
): string {
  return filterLsRemoteEntries(result.entries, options.filter ?? "branches")
    .map((entry) => checkoutTrackingCommand(entry.name, remote))
    .join("\n")
}

export function formatLsRemoteMarkdown(result: LsRemoteParseResult): string {
  if (result.entries.length === 0) {
    return "_No remote refs found._"
  }

  const { summary } = result
  const lines = [
    `**${summary.total}** remote ref(s) — ${summary.branches} branch(es), ${summary.tags} tag(s), ${summary.peeled} annotated`,
    summary.defaultBranch
      ? `Default branch: \`${summary.defaultBranch}\` (HEAD → \`${shortHash(summary.headHash ?? "")}\`)`
      : summary.headHash
        ? `HEAD → \`${shortHash(summary.headHash)}\``
        : "",
    "",
    "| Ref | Hash | Kind |",
    "|-----|------|------|",
  ].filter(Boolean)

  for (const entry of result.entries) {
    const kind =
      entry.kind === "tag" && entry.isAnnotatedTag
        ? "tag (annotated)"
        : entry.kind
    lines.push(
      `| \`${entry.name}\` | \`${entry.shortHash}\` | ${kind} |`,
    )
  }

  return lines.join("\n").trimEnd()
}
