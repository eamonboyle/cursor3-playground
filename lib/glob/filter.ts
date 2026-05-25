import type {
  GlobFilterResult,
  GlobPathMatch,
  GlobPatternKind,
  GlobPatternLine,
} from "./types"

/** Escape regex metacharacters in a literal glob segment. */
function escapeRegex(literal: string): string {
  return literal.replace(/[.+^${}()|[\]\\]/g, "\\$&")
}

/**
 * Turn a simple gitignore-style glob into a RegExp tested against a full repo path.
 * Supports `*`, `?`, and `**` (crosses `/`).
 */
export function globToRegExp(pattern: string): RegExp {
  const normalized = pattern.replace(/\\/g, "/").replace(/\/+$/, "")
  let re = "^"
  let i = 0

  while (i < normalized.length) {
    const c = normalized[i]

    if (c === "*") {
      if (normalized[i + 1] === "*") {
        const after = normalized[i + 2]
        if (after === "/") {
          re += "(?:.*/)?"
          i += 3
        } else if (after === undefined) {
          re += ".*"
          i += 2
        } else {
          re += ".*"
          i += 2
        }
      } else {
        re += "[^/]*"
        i += 1
      }
      continue
    }

    if (c === "?") {
      re += "[^/]"
      i += 1
      continue
    }

    re += escapeRegex(c)
    i += 1
  }

  re += "$"
  return new RegExp(re)
}

/**
 * Match a repo-relative path against a glob pattern.
 * Patterns without `/` also match the basename (gitignore-style).
 */
export function matchGlob(path: string, pattern: string): boolean {
  const normalizedPath = path.replace(/\\/g, "/").replace(/^\.\/+/, "")
  const normalizedPattern = pattern.replace(/\\/g, "/").trim()

  if (!normalizedPattern) {
    return false
  }

  const re = globToRegExp(normalizedPattern)
  if (re.test(normalizedPath)) {
    return true
  }

  if (!normalizedPattern.includes("/")) {
    const base = normalizedPath.split("/").pop() ?? normalizedPath
    return re.test(base)
  }

  return false
}

function parsePatternLines(text: string): {
  patterns: GlobPatternLine[]
  warnings: string[]
} {
  const patterns: GlobPatternLine[] = []
  const warnings: string[] = []
  const lines = text.replace(/\r\n/g, "\n").split("\n")

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? ""
    const trimmed = raw.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    let kind: GlobPatternKind = "include"
    let pattern = trimmed

    if (pattern.startsWith("!")) {
      kind = "exclude"
      pattern = pattern.slice(1).trim()
      if (!pattern) {
        warnings.push(`Line ${i + 1}: exclude pattern is empty after '!'.`)
        continue
      }
    }

    patterns.push({
      raw: trimmed,
      pattern,
      kind,
      line: i + 1,
    })
  }

  return { patterns, warnings }
}

function parsePathLines(text: string): string[] {
  const seen = new Set<string>()
  const paths: string[] = []

  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const path = line.trim().replace(/^\.\/+/, "")
    if (!path || path.startsWith("#")) {
      continue
    }
    if (!seen.has(path)) {
      seen.add(path)
      paths.push(path)
    }
  }

  return paths.sort((a, b) => a.localeCompare(b))
}

function matchPath(
  path: string,
  patterns: GlobPatternLine[],
): { matchedBy: string[]; excludedBy: string[] } {
  const matchedBy: string[] = []
  const excludedBy: string[] = []

  for (const entry of patterns) {
    if (!matchGlob(path, entry.pattern)) {
      continue
    }
    if (entry.kind === "include") {
      matchedBy.push(entry.raw)
    } else {
      excludedBy.push(entry.raw)
    }
  }

  return { matchedBy, excludedBy }
}

/**
 * Filter repo paths with include globs and optional `!` exclude lines.
 * A path is included when it matches at least one include pattern (or all patterns
 * if only excludes are given) and is not overridden by a matching exclude.
 */
export function filterPathsByGlobs(
  pathsText: string,
  patternsText: string,
): GlobFilterResult {
  const paths = parsePathLines(pathsText)
  const { patterns, warnings } = parsePatternLines(patternsText)

  const includes = patterns.filter((p) => p.kind === "include")
  const hasIncludes = includes.length > 0

  if (patterns.length === 0) {
    warnings.push("Add at least one glob pattern (lines starting with # are comments).")
  }

  const included: GlobPathMatch[] = []
  const excluded: GlobPathMatch[] = []
  const unmatched: string[] = []

  for (const path of paths) {
    const { matchedBy, excludedBy } = matchPath(path, patterns)
    const hasIncludeMatch = matchedBy.length > 0
    const hasExcludeMatch = excludedBy.length > 0

    const inScope = hasIncludes
      ? hasIncludeMatch && !hasExcludeMatch
      : !hasExcludeMatch

    const entry: GlobPathMatch = { path, matchedBy, excludedBy }

    if (inScope) {
      included.push(entry)
    } else if (hasIncludeMatch || hasExcludeMatch) {
      excluded.push(entry)
    } else {
      unmatched.push(path)
    }
  }

  return {
    paths,
    patterns,
    included,
    excluded,
    unmatched,
    warnings,
  }
}

export function formatGlobScopeMarkdown(result: GlobFilterResult): string {
  const lines: string[] = []
  lines.push("## Glob scope")
  lines.push("")
  lines.push(
    `- **${result.included.length}** included · **${result.excluded.length}** excluded by rule · **${result.unmatched.length}** unmatched`,
  )
  lines.push(`- **${result.paths.length}** paths · **${result.patterns.length}** patterns`)
  lines.push("")

  if (result.included.length > 0) {
    lines.push("### Included")
    for (const row of result.included) {
      lines.push(`- \`${row.path}\``)
    }
    lines.push("")
  }

  if (result.excluded.length > 0) {
    lines.push("### Excluded / filtered out")
    for (const row of result.excluded) {
      const why = row.excludedBy.length
        ? row.excludedBy.map((p) => `\`${p}\``).join(", ")
        : row.matchedBy.map((p) => `\`${p}\``).join(", ")
      lines.push(`- \`${row.path}\` (${why})`)
    }
    lines.push("")
  }

  if (result.warnings.length > 0) {
    lines.push("### Warnings")
    for (const w of result.warnings) {
      lines.push(`- ${w}`)
    }
  }

  return lines.join("\n").trim()
}
