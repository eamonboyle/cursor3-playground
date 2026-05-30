import type { RenameMapResult, RenameRule, RenamedPath } from "./types"

/** Normalize a repo-relative path to forward slashes without leading `./`. */
export function normalizeRepoPath(path: string): string {
  return path
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/\/+$/, "")
}

/** Ripgrep / grep -n style: path:line:optionalColumn:rest */
const RG_LINE_RE = /^(.*?):(\d+)(?::(\d+))?:\s*(.*)$/

/** `old => new`, `old -> new`, or tab-separated pair. */
const RULE_ARROW_RE =
  /^\s*(.+?)\s*(?:=>|->)\s*(.+?)\s*$/

/** Git status: `R100 old/path new/path` or `renamed: old -> new`. */
const RULE_GIT_RE =
  /^\s*(?:R\d+|rename(?:d)?)\s+(.+?)\s+(.+?)\s*$/i

function parseRuleLine(line: string, sourceLine: number): RenameRule | undefined {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) {
    return undefined
  }

  const arrow = RULE_ARROW_RE.exec(trimmed)
  if (arrow) {
    const from = normalizeRepoPath(arrow[1] ?? "")
    const to = normalizeRepoPath(arrow[2] ?? "")
    if (from && to) {
      return { from, to, sourceLine, raw: line.trimEnd() }
    }
    return undefined
  }

  const git = RULE_GIT_RE.exec(trimmed)
  if (git) {
    const from = normalizeRepoPath(git[1] ?? "")
    const to = normalizeRepoPath(git[2] ?? "")
    if (from && to) {
      return { from, to, sourceLine, raw: line.trimEnd() }
    }
    return undefined
  }

  const tab = trimmed.split(/\t+/)
  if (tab.length === 2) {
    const from = normalizeRepoPath(tab[0] ?? "")
    const to = normalizeRepoPath(tab[1] ?? "")
    if (from && to) {
      return { from, to, sourceLine, raw: line.trimEnd() }
    }
  }

  return undefined
}

export function parseRenameRules(text: string): RenameRule[] {
  const rules: RenameRule[] = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const rule = parseRuleLine(lines[i] ?? "", i + 1)
    if (rule) {
      rules.push(rule)
    }
  }
  return rules
}

function sortRules(rules: RenameRule[]): RenameRule[] {
  return [...rules].sort((a, b) => b.from.length - a.from.length)
}

/**
 * Apply a single rename rule: exact path match or directory prefix.
 */
export function applyRenameRule(
  path: string,
  rule: Pick<RenameRule, "from" | "to">,
): string {
  const normalized = normalizeRepoPath(path)
  const from = normalizeRepoPath(rule.from)
  const to = normalizeRepoPath(rule.to)

  if (!normalized || !from) {
    return normalized || path
  }

  if (normalized === from) {
    return to
  }

  const prefix = `${from}/`
  if (normalized.startsWith(prefix)) {
    return to + normalized.slice(from.length)
  }

  return normalized
}

export function applyRenameRules(
  path: string,
  rules: RenameRule[],
): string {
  if (rules.length === 0) {
    return normalizeRepoPath(path)
  }

  let current = normalizeRepoPath(path)
  const ordered = sortRules(rules)
  const maxPasses = Math.max(1, rules.length)

  for (let pass = 0; pass < maxPasses; pass++) {
    let next = current
    for (const rule of ordered) {
      next = applyRenameRule(next, rule)
    }
    if (next === current) {
      break
    }
    current = next
  }

  return current
}

function transformPathLine(
  line: string,
  sourceLine: number,
  rules: RenameRule[],
): RenamedPath {
  const trimmed = line.trimEnd()
  if (!trimmed) {
    return {
      before: "",
      after: "",
      changed: false,
      sourceLine,
      raw: trimmed,
    }
  }

  const rg = RG_LINE_RE.exec(trimmed)
  if (rg) {
    const path = rg[1]?.trim() ?? ""
    const lineNum = rg[2]
    const column = rg[3]
    const rest = rg[4] ?? ""
    const afterPath = applyRenameRules(path, rules)
    const col = column !== undefined ? `:${column}` : ""
    const suffix = rest ? `: ${rest}` : ""
    const after = `${afterPath}:${lineNum}${col}${suffix}`
    return {
      before: path,
      after,
      changed: afterPath !== normalizeRepoPath(path),
      sourceLine,
      raw: trimmed,
    }
  }

  const before = normalizeRepoPath(trimmed)
  const afterPath = applyRenameRules(before, rules)
  return {
    before,
    after: afterPath,
    changed: afterPath !== before,
    sourceLine,
    raw: trimmed,
  }
}

export function applyRenameMap(
  rulesText: string,
  pathsText: string,
): RenameMapResult {
  const warnings: string[] = []
  const rules = parseRenameRules(rulesText)
  const paths: RenamedPath[] = []

  const lines = pathsText.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    if (!line.trim()) {
      continue
    }
    paths.push(transformPathLine(line, i + 1, rules))
  }

  const changed = paths.filter((p) => p.changed).length
  const unchanged = paths.length - changed

  if (!rulesText.trim()) {
    warnings.push("Add rename rules — one per line: old/path => new/path")
  } else if (rules.length === 0) {
    warnings.push(
      "No rules parsed. Use `from => to`, `from -> to`, git `R100 from to`, or tab-separated pairs.",
    )
  }

  if (!pathsText.trim()) {
    warnings.push("Paste paths, ripgrep hits, or stack frame paths to rewrite.")
  } else if (paths.length === 0) {
    warnings.push("No path lines to transform.")
  } else if (rules.length > 0 && changed === 0) {
    warnings.push("No paths matched any rule — check prefixes and spelling.")
  }

  return {
    rules,
    paths,
    summary: {
      total: paths.length,
      changed,
      unchanged,
    },
    warnings,
  }
}

export function formatRenameMapMarkdown(result: RenameMapResult): string {
  if (result.paths.length === 0) {
    return "_No paths to show._"
  }

  const lines = [
    `**${result.summary.changed}** of **${result.summary.total}** path(s) updated`,
    "",
  ]

  if (result.rules.length > 0) {
    lines.push("### Rules")
    for (const r of result.rules) {
      lines.push(`- \`${r.from}\` → \`${r.to}\``)
    }
    lines.push("")
  }

  lines.push("### Paths")
  for (const p of result.paths) {
    if (p.changed) {
      lines.push(`- \`${p.before}\` → \`${p.after}\``)
    } else {
      lines.push(`- \`${p.before}\` _(unchanged)_`)
    }
  }

  return lines.join("\n")
}

export function formatRenameMapOutput(result: RenameMapResult): string {
  return result.paths.map((p) => p.after).join("\n")
}
