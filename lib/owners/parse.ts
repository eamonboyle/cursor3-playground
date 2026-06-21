import type {
  CodeownersResult,
  CodeownersRule,
  CodeownersSummary,
  FileOwnerMatch,
  OwnerGroup,
} from "./types"

const OWNER_TOKEN_RE = /^@[\w.-]+(?:\/[\w.-]+)?$|^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Escape regex metacharacters in a literal glob segment. */
function escapeRegex(literal: string): string {
  return literal.replace(/[.+^${}()|[\]\\]/g, "\\$&")
}

function globToRegExp(pattern: string): RegExp {
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

function matchGlob(path: string, pattern: string): boolean {
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

function normalizeCodeownersPattern(pattern: string): string {
  let normalized = pattern.replace(/\\/g, "/").trim()
  if (normalized.startsWith("/")) {
    normalized = normalized.slice(1)
  }
  return normalized
}

function matchCodeownersPattern(path: string, pattern: string): boolean {
  const normalized = normalizeCodeownersPattern(pattern)
  if (!normalized) {
    return false
  }

  if (matchGlob(path, normalized)) {
    return true
  }

  if (normalized.endsWith("/")) {
    return (
      matchGlob(path, `${normalized}**`) || matchGlob(path, `${normalized}*`)
    )
  }

  return false
}

function parsePathLines(text: string): string[] {
  const seen = new Set<string>()
  const paths: string[] = []

  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const path = trimmed.replace(/^\.\/+/, "").replace(/\\/g, "/")
    if (!seen.has(path)) {
      seen.add(path)
      paths.push(path)
    }
  }

  return paths.sort((a, b) => a.localeCompare(b))
}

function isOwnerToken(token: string): boolean {
  return OWNER_TOKEN_RE.test(token)
}

/**
 * Parse a CODEOWNERS file into ordered rules (last match wins per GitHub semantics).
 */
export function parseCodeownersRules(text: string): {
  rules: CodeownersRule[]
  warnings: string[]
} {
  const rules: CodeownersRule[] = []
  const warnings: string[] = []
  const lines = text.replace(/\r\n/g, "\n").split("\n")

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? ""
    const trimmed = raw.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const tokens = trimmed.split(/\s+/).filter(Boolean)
    if (tokens.length < 2) {
      warnings.push(
        `Line ${i + 1}: expected a pattern followed by at least one owner.`,
      )
      continue
    }

    const pattern = tokens[0]
    if (!pattern) {
      continue
    }

    const owners = tokens.slice(1)
    const invalidOwners = owners.filter((owner) => !isOwnerToken(owner))
    if (invalidOwners.length > 0) {
      warnings.push(
        `Line ${i + 1}: unrecognized owner token(s): ${invalidOwners.join(", ")}`,
      )
    }

    const validOwners = owners.filter((owner) => isOwnerToken(owner))
    if (validOwners.length === 0) {
      warnings.push(`Line ${i + 1}: no valid owners after pattern \`${pattern}\`.`)
      continue
    }

    rules.push({
      pattern,
      owners: validOwners,
      line: i + 1,
      raw: trimmed,
    })
  }

  return { rules, warnings }
}

function matchPathToRule(
  path: string,
  rules: CodeownersRule[],
): Pick<FileOwnerMatch, "owners" | "matchedPattern" | "ruleLine"> {
  let owners: string[] = []
  let matchedPattern: string | undefined
  let ruleLine: number | undefined

  for (const rule of rules) {
    if (matchCodeownersPattern(path, rule.pattern)) {
      owners = rule.owners
      matchedPattern = rule.pattern
      ruleLine = rule.line
    }
  }

  return { owners, matchedPattern, ruleLine }
}

function buildByOwner(matches: FileOwnerMatch[]): OwnerGroup[] {
  const map = new Map<string, string[]>()

  for (const match of matches) {
    for (const owner of match.owners) {
      const paths = map.get(owner) ?? []
      if (!paths.includes(match.path)) {
        paths.push(match.path)
      }
      map.set(owner, paths)
    }
  }

  return [...map.entries()]
    .map(([owner, paths]) => ({
      owner,
      paths: [...paths].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.owner.localeCompare(b.owner))
}

function buildSummary(
  paths: string[],
  matches: FileOwnerMatch[],
  rules: CodeownersRule[],
): CodeownersSummary {
  const owned = matches.filter((match) => match.owners.length > 0).length
  const ownerSet = new Set<string>()
  for (const match of matches) {
    for (const owner of match.owners) {
      ownerSet.add(owner)
    }
  }

  return {
    totalPaths: paths.length,
    owned,
    unowned: paths.length - owned,
    uniqueOwners: ownerSet.size,
    ruleCount: rules.length,
  }
}

/**
 * Resolve CODEOWNERS rules against a list of changed repo paths.
 */
export function resolveCodeowners(
  codeownersText: string,
  pathsText: string,
): CodeownersResult {
  const { rules, warnings: ruleWarnings } = parseCodeownersRules(codeownersText)
  const paths = parsePathLines(pathsText)
  const warnings = [...ruleWarnings]

  const matches: FileOwnerMatch[] = paths.map((path) => {
    const ruleMatch = matchPathToRule(path, rules)
    return { path, ...ruleMatch }
  })

  const unowned = matches
    .filter((match) => match.owners.length === 0)
    .map((match) => match.path)

  if (!codeownersText.trim()) {
    warnings.push("Paste a CODEOWNERS file (from .github/CODEOWNERS or similar).")
  } else if (rules.length === 0) {
    warnings.push(
      "No rules parsed. Each line needs a glob pattern and one or more @owners.",
    )
  }

  if (!pathsText.trim()) {
    warnings.push(
      "Paste changed paths from git diff --name-only or git diff --name-status.",
    )
  } else if (paths.length === 0) {
    warnings.push("No file paths found in the changed-files input.")
  }

  return {
    rules,
    matches,
    byOwner: buildByOwner(matches.filter((match) => match.owners.length > 0)),
    unowned,
    warnings,
    summary: buildSummary(paths, matches, rules),
  }
}

export function formatCodeownersMarkdown(result: CodeownersResult): string {
  const { summary } = result
  const lines = [
    "## CODEOWNERS review map",
    "",
    `- **${summary.owned}** owned · **${summary.unowned}** unowned · **${summary.uniqueOwners}** reviewer(s) · **${summary.ruleCount}** rules`,
    "",
  ]

  if (result.byOwner.length > 0) {
    lines.push("### By owner")
    for (const group of result.byOwner) {
      lines.push(`- **${group.owner}** (${group.paths.length})`)
      for (const path of group.paths) {
        lines.push(`  - \`${path}\``)
      }
    }
    lines.push("")
  }

  if (result.unowned.length > 0) {
    lines.push("### Unowned")
    for (const path of result.unowned) {
      lines.push(`- \`${path}\``)
    }
    lines.push("")
  }

  if (result.warnings.length > 0) {
    lines.push("### Warnings")
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`)
    }
  }

  return lines.join("\n").trim()
}

/** GitHub-style review request line: one @mention per unique owner. */
export function formatReviewRequest(result: CodeownersResult): string {
  const owners = result.byOwner.map((group) => group.owner)
  if (owners.length === 0) {
    return ""
  }
  return owners.map((owner) => (owner.startsWith("@") ? owner : `@${owner}`)).join(" ")
}

export function formatUnownedPaths(result: CodeownersResult): string {
  return result.unowned.join("\n")
}
