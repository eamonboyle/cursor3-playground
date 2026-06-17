import type {
  AuditFinding,
  AuditParseResult,
  AuditSeverity,
  AuditSummary,
} from "./types"

const SEVERITIES: readonly AuditSeverity[] = [
  "critical",
  "high",
  "moderate",
  "low",
  "info",
] as const

function emptyBySeverity(): Record<AuditSeverity, number> {
  return { critical: 0, high: 0, moderate: 0, low: 0, info: 0 }
}

function isSeverity(value: string): value is AuditSeverity {
  return (SEVERITIES as readonly string[]).includes(value.toLowerCase())
}

function splitTableCells(line: string): string[] | undefined {
  if (!line.includes("│")) {
    return undefined
  }
  const parts = line.split("│").map((cell) => cell.trim())
  const cells = parts.filter((cell, index) => {
    if (index === 0 || index === parts.length - 1) {
      return cell.length > 0
    }
    return true
  })
  if (cells.length === 0) {
    return undefined
  }
  return cells
}

function isTableBorder(line: string): boolean {
  const trimmed = line.trim()
  return (
    trimmed.startsWith("┌") ||
    trimmed.startsWith("├") ||
    trimmed.startsWith("└") ||
    trimmed.startsWith("─") ||
    (trimmed.startsWith("|") && /^[\|\+\-]+$/.test(trimmed))
  )
}

function parseAdvisoryBlock(
  block: string,
  sourceLine: number
): AuditFinding | undefined {
  const lines = block.split(/\r?\n/)
  let severity: AuditSeverity | undefined
  let title = ""
  let packageName = ""
  let vulnerableVersions = ""
  let patchedVersions = ""
  const paths: string[] = []
  let url: string | undefined
  let pendingTitle = false

  for (const line of lines) {
    if (isTableBorder(line)) {
      continue
    }

    const cells = splitTableCells(line)
    if (!cells) {
      continue
    }

    if (cells.length === 1) {
      if (pendingTitle) {
        title = title ? `${title} ${cells[0]}` : cells[0]!
      }
      continue
    }

    const key = cells[0]!.toLowerCase()
    const value = cells[1] ?? ""

    if (isSeverity(key)) {
      severity = key
      title = value
      pendingTitle = true
      continue
    }

    pendingTitle = false

    switch (key) {
      case "package":
        packageName = value
        break
      case "vulnerable versions":
        vulnerableVersions = value
        break
      case "patched versions":
        patchedVersions = value
        break
      case "paths":
        if (value) {
          paths.push(value)
        }
        break
      case "more info":
        url = value.trim() || undefined
        break
      default:
        if (!key && value) {
          title = title ? `${title} ${value}` : value
          pendingTitle = true
        }
        break
    }
  }

  if (!severity || !packageName) {
    return undefined
  }

  return {
    severity,
    title: title.trim(),
    packageName,
    vulnerableVersions,
    patchedVersions,
    paths,
    url,
    cves: [],
    sourceLine,
  }
}

function splitAdvisoryBlocks(text: string): { block: string; line: number }[] {
  const lines = text.split(/\r?\n/)
  const blocks: { block: string; line: number }[] = []
  let current: string[] = []
  let startLine = 1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    if (line.trimStart().startsWith("┌")) {
      if (current.length > 0) {
        blocks.push({ block: current.join("\n"), line: startLine })
      }
      current = [line]
      startLine = i + 1
    } else if (current.length > 0) {
      current.push(line)
      if (line.trimStart().startsWith("└")) {
        blocks.push({ block: current.join("\n"), line: startLine })
        current = []
      }
    }
  }

  if (current.length > 0) {
    blocks.push({ block: current.join("\n"), line: startLine })
  }

  return blocks
}

type JsonAdvisory = {
  title?: string
  severity?: string
  module_name?: string
  vulnerable_versions?: string
  patched_versions?: string
  cves?: string[]
  url?: string
  findings?: { paths?: string[] }[]
}

function parseJsonInput(text: string): AuditFinding[] | undefined {
  const trimmed = text.trim()
  if (!trimmed.startsWith("{")) {
    return undefined
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return undefined
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return undefined
  }

  const root = parsed as { advisories?: Record<string, JsonAdvisory> }
  if (!root.advisories || typeof root.advisories !== "object") {
    return undefined
  }

  const findings: AuditFinding[] = []
  for (const advisory of Object.values(root.advisories)) {
    if (!advisory || typeof advisory !== "object") {
      continue
    }
    const severityRaw = advisory.severity ?? ""
    if (!isSeverity(severityRaw)) {
      continue
    }
    const packageName = advisory.module_name ?? ""
    if (!packageName) {
      continue
    }

    const paths: string[] = []
    for (const finding of advisory.findings ?? []) {
      for (const path of finding.paths ?? []) {
        if (path && !paths.includes(path)) {
          paths.push(path)
        }
      }
    }

    findings.push({
      severity: severityRaw,
      title: advisory.title ?? "",
      packageName,
      vulnerableVersions: advisory.vulnerable_versions ?? "",
      patchedVersions: advisory.patched_versions ?? "",
      paths,
      url: advisory.url,
      cves: advisory.cves ?? [],
      sourceLine: 0,
    })
  }

  return findings.length > 0 ? findings : undefined
}

function buildSummary(findings: AuditFinding[]): AuditSummary {
  const bySeverity = emptyBySeverity()
  for (const finding of findings) {
    bySeverity[finding.severity]++
  }
  return {
    total: findings.length,
    bySeverity,
  }
}

const SEVERITY_ORDER: Record<AuditSeverity, number> = {
  critical: 0,
  high: 1,
  moderate: 2,
  low: 3,
  info: 4,
}

export function sortAuditFindings(findings: AuditFinding[]): AuditFinding[] {
  return [...findings].sort((a, b) => {
    const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    if (sev !== 0) {
      return sev
    }
    return a.packageName.localeCompare(b.packageName)
  })
}

/**
 * Parse `pnpm audit` table output or `--json` for severity grouping and copyable fix hints.
 */
export function parseAuditScan(text: string): AuditParseResult {
  const warnings: string[] = []
  const trimmed = text.trim()

  if (!trimmed) {
    warnings.push("Paste `pnpm audit` output or `pnpm audit --json`.")
    return {
      findings: [],
      summary: { total: 0, bySeverity: emptyBySeverity() },
      warnings,
    }
  }

  const fromJson = parseJsonInput(trimmed)
  if (fromJson) {
    const findings = sortAuditFindings(fromJson)
    return {
      findings,
      summary: buildSummary(findings),
      warnings,
    }
  }

  const findings: AuditFinding[] = []
  for (const { block, line } of splitAdvisoryBlocks(trimmed)) {
    const finding = parseAdvisoryBlock(block, line)
    if (finding) {
      findings.push(finding)
    }
  }

  if (findings.length === 0) {
    warnings.push(
      "No vulnerabilities found. Try: pnpm audit  or  pnpm audit --json"
    )
  }

  const sorted = sortAuditFindings(findings)
  return {
    findings: sorted,
    summary: buildSummary(sorted),
    warnings,
  }
}

export function formatAuditMarkdown(result: AuditParseResult): string {
  if (result.findings.length === 0) {
    return "_No vulnerabilities found._"
  }

  const { summary } = result
  const sevParts = SEVERITIES.filter((s) => summary.bySeverity[s] > 0).map(
    (s) => `${s}: ${summary.bySeverity[s]}`
  )

  const lines = [
    `**${summary.total}** vulnerabilit${summary.total === 1 ? "y" : "ies"} — ${sevParts.join(", ")}`,
    "",
  ]

  for (const f of result.findings) {
    const cve =
      f.cves.length > 0 ? ` (${f.cves.join(", ")})` : ""
    const path =
      f.paths.length > 0 ? ` — \`${f.paths[0]}\`` : ""
    lines.push(
      `- **${f.severity}** \`${f.packageName}\`${cve}: ${f.title}${path}`
    )
    if (f.patchedVersions) {
      lines.push(`  - Patched: ${f.patchedVersions}`)
    }
    if (f.url) {
      lines.push(`  - ${f.url}`)
    }
  }

  return lines.join("\n")
}

export function formatAuditPackageNames(result: AuditParseResult): string {
  const seen = new Set<string>()
  const names: string[] = []
  for (const f of result.findings) {
    if (!seen.has(f.packageName)) {
      seen.add(f.packageName)
      names.push(f.packageName)
    }
  }
  return names.join("\n")
}

export function formatAuditPaths(result: AuditParseResult): string {
  const seen = new Set<string>()
  const paths: string[] = []
  for (const f of result.findings) {
    for (const path of f.paths) {
      if (!seen.has(path)) {
        seen.add(path)
        paths.push(path)
      }
    }
  }
  return paths.join("\n")
}

export function formatAuditFixCommand(result: AuditParseResult): string {
  if (result.findings.length === 0) {
    return ""
  }
  return "pnpm audit --fix"
}
