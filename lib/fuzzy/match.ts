import type {
  FuzzyMatch,
  FuzzyMatchBatchResult,
  FuzzyMatchReason,
  FuzzyQueryResult,
} from "./types"

/** Normalize a repo-relative path to forward slashes without leading `./`. */
export function normalizeRepoPath(path: string): string {
  return path
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/\/+$/, "")
}

/** Classic Levenshtein edit distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) {
    return 0
  }
  if (!a.length) {
    return b.length
  }
  if (!b.length) {
    return a.length
  }

  const rows = a.length + 1
  const cols = b.length + 1
  const matrix: number[][] = Array.from({ length: rows }, () =>
    Array<number>(cols).fill(0),
  )

  for (let i = 0; i < rows; i++) {
    matrix[i]![0] = i
  }
  for (let j = 0; j < cols; j++) {
    matrix[0]![j] = j
  }

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost,
      )
    }
  }

  return matrix[a.length]![b.length]!
}

function basename(path: string): string {
  const parts = path.split("/")
  return parts[parts.length - 1] ?? path
}

function dirname(path: string): string {
  const idx = path.lastIndexOf("/")
  return idx === -1 ? "" : path.slice(0, idx)
}

export type FuzzyMatchOptions = {
  limit?: number
  maxDistance?: number
}

function defaultMaxDistance(query: string): number {
  const len = Math.max(query.length, basename(query).length)
  return Math.max(3, Math.ceil(len * 0.4))
}

function scoreCandidate(
  query: string,
  candidate: string,
): { score: number; distance: number; reason: FuzzyMatchReason } | undefined {
  if (!query || !candidate) {
    return undefined
  }

  if (query === candidate) {
    return { score: 0, distance: 0, reason: "exact" }
  }

  const queryLower = query.toLowerCase()
  const candidateLower = candidate.toLowerCase()
  if (queryLower === candidateLower) {
    return { score: 0.5, distance: 0, reason: "case-insensitive" }
  }

  const queryBase = basename(query)
  const candidateBase = basename(candidate)

  if (queryBase && queryBase === candidateBase) {
    const dirDist = levenshtein(dirname(query), dirname(candidate))
    return {
      score: 1 + dirDist * 0.05,
      distance: dirDist,
      reason: "basename",
    }
  }

  if (
    candidate.endsWith(`/${query}`) ||
    candidate === query ||
    candidate.endsWith(query)
  ) {
    const distance = candidate.length - query.length
    return { score: 2 + distance * 0.01, distance, reason: "suffix" }
  }

  const pathDistance = levenshtein(queryLower, candidateLower)
  const baseDistance = levenshtein(
    queryBase.toLowerCase(),
    candidateBase.toLowerCase(),
  )
  const distance = Math.min(pathDistance, baseDistance + 1)

  return { score: 3 + distance, distance, reason: "levenshtein" }
}

/**
 * Parse one repo path per line; blank lines and # comments are skipped.
 */
export function parsePathList(text: string): string[] {
  const seen = new Set<string>()
  const paths: string[] = []

  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }
    const path = normalizeRepoPath(trimmed)
    if (!path || seen.has(path)) {
      continue
    }
    seen.add(path)
    paths.push(path)
  }

  return paths.sort((a, b) => a.localeCompare(b))
}

/**
 * Rank candidate repo paths for a single misspelled or partial query.
 */
export function findFuzzyMatches(
  query: string,
  candidates: string[],
  options: FuzzyMatchOptions = {},
): FuzzyQueryResult {
  const warnings: string[] = []
  const normalizedQuery = normalizeRepoPath(query)

  if (!normalizedQuery) {
    return {
      query: query.trim(),
      matches: [],
      warnings: ["Enter a path or filename to match against the candidate list."],
    }
  }

  if (candidates.length === 0) {
    return {
      query: normalizedQuery,
      matches: [],
      warnings: [
        "Add candidate paths — try: git ls-files or find . -type f | sed 's|^\\./||'",
      ],
    }
  }

  const limit = options.limit ?? 8
  const maxDistance =
    options.maxDistance ?? defaultMaxDistance(normalizedQuery)

  const matches: FuzzyMatch[] = []

  for (const candidate of candidates) {
    const scored = scoreCandidate(normalizedQuery, candidate)
    if (!scored) {
      continue
    }
    if (scored.reason === "levenshtein" && scored.distance > maxDistance) {
      continue
    }
    matches.push({
      path: candidate,
      score: scored.score,
      distance: scored.distance,
      reason: scored.reason,
    })
  }

  matches.sort((a, b) => {
    if (a.score !== b.score) {
      return a.score - b.score
    }
    if (a.distance !== b.distance) {
      return a.distance - b.distance
    }
    return a.path.localeCompare(b.path)
  })

  const top = matches.slice(0, limit)

  if (top.length === 0) {
    warnings.push(
      `No paths within edit distance ${maxDistance}. Try a shorter query or broaden the candidate list.`,
    )
  }

  return {
    query: normalizedQuery,
    matches: top,
    warnings,
  }
}

/**
 * Match multiple query lines (wrong paths from logs or agent output) against candidates.
 */
export function findFuzzyMatchesBatch(
  queriesText: string,
  candidatesText: string,
  options: FuzzyMatchOptions = {},
): FuzzyMatchBatchResult {
  const warnings: string[] = []
  const candidates = parsePathList(candidatesText)
  const queryLines = queriesText
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))

  if (queryLines.length === 0) {
    warnings.push(
      "Paste one or more misspelled paths — file:line prefixes from ripgrep are stripped automatically.",
    )
  }

  if (candidates.length === 0) {
    warnings.push("Paste a repo file list to search against.")
  }

  const queries: FuzzyQueryResult[] = []

  for (const raw of queryLines) {
    const rg = /^(.*?):(\d+)(?::(\d+))?:\s*(.*)$/.exec(raw)
    const query = rg ? (rg[1]?.trim() ?? raw) : raw
    const result = findFuzzyMatches(query, candidates, options)
    queries.push(result)
    for (const w of result.warnings) {
      if (!warnings.includes(w)) {
        warnings.push(w)
      }
    }
  }

  return { queries, candidates, warnings }
}

export function formatFuzzyMatchMarkdown(
  result: FuzzyMatchBatchResult,
): string {
  if (result.queries.length === 0) {
    return "_No queries to match._"
  }

  const lines: string[] = [
    "## Fuzzy path matches",
    "",
    `**${result.candidates.length}** candidate path(s)`,
    "",
  ]

  for (const q of result.queries) {
    lines.push(`### \`${q.query}\``)
    if (q.matches.length === 0) {
      lines.push("_No close matches._")
    } else {
      for (const m of q.matches) {
        lines.push(
          `- \`${m.path}\` (${m.reason}, distance ${m.distance})`,
        )
      }
    }
    lines.push("")
  }

  return lines.join("\n").trim()
}

export function formatFuzzyMatchPaths(result: FuzzyMatchBatchResult): string {
  const lines: string[] = []
  for (const q of result.queries) {
    const best = q.matches[0]
    if (best) {
      lines.push(best.path)
    }
  }
  return lines.join("\n")
}
