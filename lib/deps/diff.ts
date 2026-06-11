import type {
  DepEntry,
  DepSection,
  DepsDiffResult,
  DepVersionChange,
  PackageParseResult,
} from "./types"

const DEP_SECTIONS: DepSection[] = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
]

function depKey(section: DepSection, name: string): string {
  return `${section}:${name}`
}

function isDepSection(value: string): value is DepSection {
  return (DEP_SECTIONS as string[]).includes(value)
}

function readSection(
  root: Record<string, unknown>,
  section: DepSection,
  entries: DepEntry[],
  byKey: Map<string, DepEntry>,
  warnings: string[],
): void {
  const raw = root[section]
  if (raw === undefined) {
    return
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    warnings.push(`\`${section}\` must be an object of package versions.`)
    return
  }

  for (const [name, version] of Object.entries(raw)) {
    if (typeof version !== "string") {
      warnings.push(
        `\`${section}.${name}\` must be a string version (got ${typeof version}).`,
      )
      continue
    }
    const entry: DepEntry = { name, version, section }
    entries.push(entry)
    byKey.set(depKey(section, name), entry)
  }
}

/**
 * Parse a package.json body (full file or partial with dependency sections).
 */
export function parsePackageJson(text: string): PackageParseResult {
  const warnings: string[] = []
  const entries: DepEntry[] = []
  const byKey = new Map<string, DepEntry>()

  const trimmed = text.trim()
  if (!trimmed) {
    warnings.push("Paste a package.json body to parse dependencies.")
    return { entries, byKey, warnings }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON"
    warnings.push(`JSON parse error: ${message}`)
    return { entries, byKey, warnings }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    warnings.push("Expected a JSON object at the root.")
    return { entries, byKey, warnings }
  }

  const root = parsed as Record<string, unknown>
  let foundSection = false

  for (const section of DEP_SECTIONS) {
    if (root[section] !== undefined) {
      foundSection = true
      readSection(root, section, entries, byKey, warnings)
    }
  }

  if (!foundSection) {
    for (const key of Object.keys(root)) {
      if (isDepSection(key)) {
        foundSection = true
        readSection(root, key, entries, byKey, warnings)
      }
    }
  }

  if (!foundSection) {
    warnings.push(
      "No dependency sections found. Include dependencies, devDependencies, peerDependencies, or optionalDependencies.",
    )
  }

  return { entries, byKey, warnings }
}

/** Strip common npm range prefixes for semver comparison. */
export function stripVersionRange(version: string): string {
  const trimmed = version.trim()
  if (trimmed.startsWith("workspace:") || trimmed.startsWith("catalog:")) {
    return trimmed
  }
  if (trimmed.startsWith("npm:")) {
    const at = trimmed.lastIndexOf("@")
    return at > 4 ? trimmed.slice(at + 1) : trimmed
  }
  const rangeMatch = /^[\^~>=<]+/.exec(trimmed)
  if (rangeMatch) {
    return trimmed.slice(rangeMatch[0].length).trim()
  }
  return trimmed
}

const CORE_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?$/

function parseCoreVersion(
  raw: string,
): { valid: boolean; major: number; minor: number; patch: number } {
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

function detectBump(baseVersion: string, headVersion: string): DepVersionChange["bump"] {
  const left = parseCoreVersion(stripVersionRange(baseVersion))
  const right = parseCoreVersion(stripVersionRange(headVersion))

  if (!left.valid || !right.valid) {
    return "unknown"
  }

  if (
    left.major === right.major &&
    left.minor === right.minor &&
    left.patch === right.patch
  ) {
    return "none"
  }

  const [older, newer] =
    left.major !== right.major
      ? left.major < right.major
        ? [left, right]
        : [right, left]
      : left.minor !== right.minor
        ? left.minor < right.minor
          ? [left, right]
          : [right, left]
        : left.patch < right.patch
          ? [left, right]
          : [right, left]

  if (older.major !== newer.major) {
    return "major"
  }
  if (older.minor !== newer.minor) {
    return "minor"
  }
  if (older.patch !== newer.patch) {
    return "patch"
  }
  return "prerelease"
}

function filterBySections(
  result: PackageParseResult,
  sections: DepSection[],
): PackageParseResult {
  const allowed = new Set(sections)
  const entries = result.entries.filter((e) => allowed.has(e.section))
  const byKey = new Map<string, DepEntry>()
  for (const entry of entries) {
    byKey.set(depKey(entry.section, entry.name), entry)
  }
  return { entries, byKey, warnings: result.warnings }
}

function sortEntries(entries: DepEntry[]): DepEntry[] {
  return [...entries].sort((a, b) => {
    const section = a.section.localeCompare(b.section)
    if (section !== 0) {
      return section
    }
    return a.name.localeCompare(b.name)
  })
}

/**
 * Diff two package.json bodies by dependency name within each section.
 */
export function diffPackageJson(
  baseText: string,
  headText: string,
  options?: { sections?: DepSection[] },
): DepsDiffResult {
  const sections = options?.sections ?? DEP_SECTIONS
  const base = filterBySections(parsePackageJson(baseText), sections)
  const head = filterBySections(parsePackageJson(headText), sections)
  const warnings = [...base.warnings, ...head.warnings]

  const baseKeys = new Set(base.byKey.keys())
  const headKeys = new Set(head.byKey.keys())

  const onlyInBase: DepEntry[] = []
  const onlyInHead: DepEntry[] = []
  const matching: DepEntry[] = []
  const changed: DepVersionChange[] = []

  for (const key of [...baseKeys].sort()) {
    if (!headKeys.has(key)) {
      const entry = base.byKey.get(key)
      if (entry) {
        onlyInBase.push(entry)
      }
    }
  }

  for (const key of [...headKeys].sort()) {
    if (!baseKeys.has(key)) {
      const entry = head.byKey.get(key)
      if (entry) {
        onlyInHead.push(entry)
      }
    }
  }

  for (const key of [...baseKeys].sort()) {
    if (!headKeys.has(key)) {
      continue
    }
    const baseEntry = base.byKey.get(key)
    const headEntry = head.byKey.get(key)
    if (!baseEntry || !headEntry) {
      continue
    }
    if (baseEntry.version === headEntry.version) {
      matching.push(headEntry)
    } else {
      changed.push({
        name: baseEntry.name,
        section: baseEntry.section,
        baseVersion: baseEntry.version,
        headVersion: headEntry.version,
        bump: detectBump(baseEntry.version, headEntry.version),
      })
    }
  }

  if (
    base.byKey.size === 0 &&
    head.byKey.size === 0 &&
    baseText.trim() === "" &&
    headText.trim() === ""
  ) {
    warnings.push("Paste base and head package.json text to compare.")
  } else if (base.byKey.size === 0) {
    warnings.push("Base side has no parsed dependencies yet.")
  } else if (head.byKey.size === 0) {
    warnings.push("Head side has no parsed dependencies yet.")
  }

  return {
    base,
    head,
    onlyInBase: sortEntries(onlyInBase),
    onlyInHead: sortEntries(onlyInHead),
    matching: sortEntries(matching),
    changed: changed.sort((a, b) => {
      const section = a.section.localeCompare(b.section)
      if (section !== 0) {
        return section
      }
      return a.name.localeCompare(b.name)
    }),
    warnings,
  }
}

export function formatDepsDiffMarkdown(result: DepsDiffResult): string {
  const lines: string[] = []
  lines.push("## Package dependency diff")
  lines.push("")
  lines.push(
    `- **${result.onlyInBase.length}** removed · **${result.onlyInHead.length}** added · **${result.changed.length}** version change(s) · **${result.matching.length}** unchanged`,
  )
  lines.push(
    `- Base packages: **${result.base.byKey.size}** · Head packages: **${result.head.byKey.size}**`,
  )
  lines.push("")

  if (result.onlyInBase.length > 0) {
    lines.push("### Removed (in base only)")
    for (const entry of result.onlyInBase) {
      lines.push(
        `- \`${entry.name}\` (${entry.section}) — \`${entry.version}\``,
      )
    }
    lines.push("")
  }

  if (result.onlyInHead.length > 0) {
    lines.push("### Added (in head only)")
    for (const entry of result.onlyInHead) {
      lines.push(
        `- \`${entry.name}\` (${entry.section}) — \`${entry.version}\``,
      )
    }
    lines.push("")
  }

  if (result.changed.length > 0) {
    lines.push("### Version changes")
    for (const row of result.changed) {
      const bump =
        row.bump !== "none" && row.bump !== "unknown" ? ` (${row.bump})` : ""
      lines.push(
        `- \`${row.name}\` (${row.section}): \`${row.baseVersion}\` → \`${row.headVersion}\`${bump}`,
      )
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

export function formatDepsInstallHints(result: DepsDiffResult): string {
  const lines: string[] = []
  for (const entry of result.onlyInHead) {
    const dev = entry.section === "devDependencies" ? " -D" : ""
    lines.push(`pnpm add${dev} ${entry.name}@${entry.version}`)
  }
  for (const entry of result.onlyInBase) {
    const dev = entry.section === "devDependencies" ? " -D" : ""
    lines.push(`pnpm remove${dev} ${entry.name}`)
  }
  for (const row of result.changed) {
    const dev = row.section === "devDependencies" ? " -D" : ""
    lines.push(`pnpm add${dev} ${row.name}@${row.headVersion}`)
  }
  return lines.join("\n")
}
