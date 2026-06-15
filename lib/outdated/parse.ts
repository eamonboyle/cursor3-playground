import type {
  OutdatedBump,
  OutdatedDepType,
  OutdatedPackage,
  OutdatedParseResult,
  OutdatedSummary,
} from "./types"

const DEV_SUFFIX_RE = /\s*\(dev\)\s*$/i
const MISSING_WANTED_RE = /^missing\s*\(wanted\s+(.+?)\)\s*$/i
const CORE_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?$/

function emptyByBump(): Record<Exclude<OutdatedBump, "none">, number> {
  return { patch: 0, minor: 0, major: 0, prerelease: 0 }
}

function normalizeVersion(raw: string): string {
  const trimmed = raw.trim()
  const missing = MISSING_WANTED_RE.exec(trimmed)
  if (missing?.[1]) {
    return missing[1].trim()
  }
  return trimmed
}

function parseCoreVersion(raw: string): {
  valid: boolean
  major: number
  minor: number
  patch: number
} {
  const match = CORE_RE.exec(raw.trim())
  if (!match) {
    return { valid: false, major: 0, minor: 0, patch: 0 }
  }
  return {
    valid: true,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  }
}

function detectBump(currentRaw: string, latestRaw: string): OutdatedBump {
  const left = parseCoreVersion(normalizeVersion(currentRaw))
  const right = parseCoreVersion(normalizeVersion(latestRaw))

  if (!left.valid || !right.valid || /missing/i.test(currentRaw)) {
    return "none"
  }

  if (
    left.major === right.major &&
    left.minor === right.minor &&
    left.patch === right.patch
  ) {
    return "none"
  }

  if (left.major !== right.major) {
    return "major"
  }
  if (left.minor !== right.minor) {
    return "minor"
  }
  if (left.patch !== right.patch) {
    return "patch"
  }

  return "prerelease"
}

function parseDepType(value: string | undefined): OutdatedDepType {
  if (value === "dependencies") return "dependencies"
  if (value === "devDependencies") return "devDependencies"
  return "unknown"
}

function bumpBetween(currentRaw: string, latestRaw: string): OutdatedBump {
  return detectBump(currentRaw, latestRaw)
}

function parsePackageName(raw: string): {
  name: string
  depType: OutdatedDepType
} {
  const trimmed = raw.trim()
  const isDev = DEV_SUFFIX_RE.test(trimmed)
  const name = trimmed.replace(DEV_SUFFIX_RE, "").trim()
  return {
    name,
    depType: isDev ? "devDependencies" : "unknown",
  }
}

function isTableBorder(line: string): boolean {
  const trimmed = line.trim()
  return (
    trimmed.startsWith("┌") ||
    trimmed.startsWith("├") ||
    trimmed.startsWith("└") ||
    trimmed.startsWith("─") ||
    trimmed.startsWith("+") ||
    (trimmed.startsWith("|") && /^[\|\+\-]+$/.test(trimmed))
  )
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
  if (cells.length < 3) {
    return undefined
  }
  return cells
}

function parseTableLine(
  line: string,
  sourceLine: number
): OutdatedPackage | undefined {
  if (isTableBorder(line)) {
    return undefined
  }

  const cells = splitTableCells(line)
  if (!cells) {
    return undefined
  }

  const header = cells[0]?.toLowerCase()
  if (header === "package") {
    return undefined
  }

  const { name, depType } = parsePackageName(cells[0] ?? "")
  if (!name) {
    return undefined
  }

  let current: string
  let latest: string
  let wanted: string | undefined

  if (cells.length >= 4) {
    current = cells[1] ?? ""
    wanted = cells[2]
    latest = cells[3] ?? ""
  } else {
    current = cells[1] ?? ""
    latest = cells[2] ?? ""
  }

  if (!latest) {
    return undefined
  }

  return {
    name,
    current,
    latest,
    wanted,
    depType,
    bump: bumpBetween(current, latest),
    sourceLine,
  }
}

type JsonOutdatedEntry = {
  current?: string
  latest?: string
  wanted?: string
  dependencyType?: string
}

function parseJsonInput(text: string): OutdatedPackage[] | undefined {
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

  const packages: OutdatedPackage[] = []
  for (const [name, raw] of Object.entries(parsed)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      continue
    }
    const entry = raw as JsonOutdatedEntry
    const current = entry.current ?? ""
    const latest = entry.latest ?? ""
    if (!latest) {
      continue
    }
    packages.push({
      name,
      current,
      latest,
      wanted: entry.wanted,
      depType: parseDepType(entry.dependencyType),
      bump: bumpBetween(current, latest),
      sourceLine: 0,
    })
  }

  return packages.length > 0 ? packages : undefined
}

function buildSummary(packages: OutdatedPackage[]): OutdatedSummary {
  const byBump = emptyByBump()
  let safeCount = 0
  let majorCount = 0

  for (const pkg of packages) {
    if (pkg.bump !== "none") {
      byBump[pkg.bump]++
    }
    if (
      pkg.bump === "patch" ||
      pkg.bump === "minor" ||
      pkg.bump === "prerelease"
    ) {
      safeCount++
    }
    if (pkg.bump === "major") {
      majorCount++
    }
  }

  return {
    total: packages.length,
    byBump,
    safeCount,
    majorCount,
  }
}

/**
 * Parse `pnpm outdated` table output or `--format json` for semver bump grouping.
 */
export function parseOutdatedScan(text: string): OutdatedParseResult {
  const warnings: string[] = []
  const trimmed = text.trim()

  if (!trimmed) {
    warnings.push(
      "Paste `pnpm outdated` output or `pnpm outdated --format json`."
    )
    return {
      packages: [],
      summary: { total: 0, byBump: emptyByBump(), safeCount: 0, majorCount: 0 },
      warnings,
    }
  }

  const fromJson = parseJsonInput(trimmed)
  if (fromJson) {
    return {
      packages: fromJson,
      summary: buildSummary(fromJson),
      warnings,
    }
  }

  const packages: OutdatedPackage[] = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const pkg = parseTableLine(lines[i] ?? "", i + 1)
    if (pkg) {
      packages.push(pkg)
    }
  }

  if (packages.length === 0) {
    warnings.push(
      "No outdated packages found. Try: pnpm outdated  or  pnpm outdated --format json"
    )
  }

  return {
    packages,
    summary: buildSummary(packages),
    warnings,
  }
}

export function isSafeOutdatedBump(bump: OutdatedBump): boolean {
  return bump === "patch" || bump === "minor" || bump === "prerelease"
}

export function formatOutdatedMarkdown(result: OutdatedParseResult): string {
  if (result.packages.length === 0) {
    return "_No outdated packages found._"
  }

  const { summary } = result
  const bumpParts = (["patch", "minor", "major", "prerelease"] as const)
    .filter((b) => summary.byBump[b] > 0)
    .map((b) => `${b}: ${summary.byBump[b]}`)

  const lines = [
    `**${summary.total}** outdated — ${bumpParts.join(", ")}`,
    `- Safe (patch/minor): **${summary.safeCount}**`,
    `- Major: **${summary.majorCount}**`,
    "",
  ]

  for (const pkg of result.packages) {
    const dev = pkg.depType === "devDependencies" ? " _(dev)_" : ""
    const bump = pkg.bump === "none" ? "" : ` — **${pkg.bump}**`
    lines.push(`- \`${pkg.name}\`${dev}: ${pkg.current} → ${pkg.latest}${bump}`)
  }

  return lines.join("\n")
}

export function formatOutdatedUpdateCommand(
  result: OutdatedParseResult,
  options?: { safeOnly?: boolean; devOnly?: boolean }
): string {
  const safeOnly = options?.safeOnly ?? true
  const devOnly = options?.devOnly ?? false

  const names = result.packages
    .filter((pkg) => {
      if (devOnly && pkg.depType !== "devDependencies") {
        return false
      }
      if (safeOnly && !isSafeOutdatedBump(pkg.bump)) {
        return false
      }
      return true
    })
    .map((pkg) => pkg.name)

  if (names.length === 0) {
    return ""
  }

  return `pnpm update ${names.join(" ")}`
}
