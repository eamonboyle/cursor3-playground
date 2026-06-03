import type {
  SemverBump,
  SemverCompare,
  SemverCompareResult,
  SemverParts,
  SemverRangeCheck,
  SemverRangeKind,
  SemverSortResult,
} from "./types"

const CORE_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

function invalidParts(raw: string): SemverParts {
  return {
    raw,
    valid: false,
    major: 0,
    minor: 0,
    patch: 0,
    prerelease: [],
    build: [],
  }
}

/** Parse a strict semver 2.0 core version (optional prerelease and build). */
export function parseSemver(input: string): SemverParts {
  const raw = input.trim()
  if (!raw) {
    return invalidParts(raw)
  }

  const match = CORE_RE.exec(raw)
  if (!match) {
    return invalidParts(raw)
  }

  const major = Number(match[1])
  const minor = Number(match[2])
  const patch = Number(match[3])
  const prerelease = match[4] ? match[4].split(".") : []
  const build = match[5] ? match[5].split(".") : []

  return {
    raw,
    valid: true,
    major,
    minor,
    patch,
    prerelease,
    build,
  }
}

function compareIdentifier(a: string, b: string): SemverCompare {
  const aNum = /^\d+$/.test(a) ? Number(a) : NaN
  const bNum = /^\d+$/.test(b) ? Number(b) : NaN
  const aIsNum = !Number.isNaN(aNum)
  const bIsNum = !Number.isNaN(bNum)

  if (aIsNum && bIsNum) {
    if (aNum < bNum) return -1
    if (aNum > bNum) return 1
    return 0
  }
  if (aIsNum && !bIsNum) return -1
  if (!aIsNum && bIsNum) return 1
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

function comparePrerelease(
  left: string[],
  right: string[],
): SemverCompare {
  if (left.length === 0 && right.length === 0) return 0
  if (left.length === 0) return 1
  if (right.length === 0) return -1

  const len = Math.max(left.length, right.length)
  for (let i = 0; i < len; i++) {
    const a = left[i]
    const b = right[i]
    if (a === undefined) return -1
    if (b === undefined) return 1
    const cmp = compareIdentifier(a, b)
    if (cmp !== 0) return cmp
  }
  return 0
}

/** Compare two valid semver parts; invalid versions sort before valid ones. */
export function compareSemver(left: SemverParts, right: SemverParts): SemverCompare {
  if (!left.valid && !right.valid) return 0
  if (!left.valid) return -1
  if (!right.valid) return 1

  if (left.major !== right.major) {
    return left.major < right.major ? -1 : 1
  }
  if (left.minor !== right.minor) {
    return left.minor < right.minor ? -1 : 1
  }
  if (left.patch !== right.patch) {
    return left.patch < right.patch ? -1 : 1
  }

  return comparePrerelease(left.prerelease, right.prerelease)
}

function detectBump(left: SemverParts, right: SemverParts): SemverBump {
  if (!left.valid || !right.valid) return "none"
  const order = compareSemver(left, right)
  if (order === 0) return "none"
  const [older, newer] = order < 0 ? [left, right] : [right, left]
  if (older.major !== newer.major) return "major"
  if (older.minor !== newer.minor) return "minor"
  if (older.patch !== newer.patch) return "patch"
  return "prerelease"
}

export function compareSemverStrings(
  leftRaw: string,
  rightRaw: string,
): SemverCompareResult {
  const warnings: string[] = []
  const left = parseSemver(leftRaw)
  const right = parseSemver(rightRaw)

  if (!leftRaw.trim() || !rightRaw.trim()) {
    warnings.push("Enter two version strings to compare.")
  } else {
    if (!left.valid) warnings.push(`Left is not valid semver: "${left.raw}"`)
    if (!right.valid) warnings.push(`Right is not valid semver: "${right.raw}"`)
  }

  const order =
    left.valid && right.valid ? compareSemver(left, right) : (0 as SemverCompare)

  return {
    left,
    right,
    order,
    bump: detectBump(left, right),
    warnings,
  }
}

function parseRange(rangeRaw: string): {
  kind: SemverRangeKind | null
  version: SemverParts
} {
  const trimmed = rangeRaw.trim()
  const rangeMatch = /^(>=|<=|>|<|\^|~)?\s*(.+)$/.exec(trimmed)
  if (!rangeMatch) {
    return { kind: null, version: invalidParts(trimmed) }
  }

  const op = rangeMatch[1] ?? ""
  const versionRaw = (rangeMatch[2] ?? "").trim()
  const version = parseSemver(versionRaw)

  let kind: SemverRangeKind | null = null
  if (!op) kind = "exact"
  else if (op === "^") kind = "caret"
  else if (op === "~") kind = "tilde"
  else if (op === ">=") kind = "gte"
  else if (op === ">") kind = "gt"
  else if (op === "<=") kind = "lte"
  else if (op === "<") kind = "lt"

  return { kind, version }
}

function satisfiesCaret(version: SemverParts, anchor: SemverParts): boolean {
  if (anchor.major > 0) {
    return (
      version.major === anchor.major &&
      compareSemver(version, anchor) >= 0 &&
      version.major < anchor.major + 1
    )
  }
  if (anchor.minor > 0) {
    return (
      version.major === 0 &&
      version.minor === anchor.minor &&
      compareSemver(version, anchor) >= 0 &&
      version.minor < anchor.minor + 1
    )
  }
  return (
    version.major === 0 &&
    version.minor === 0 &&
    version.patch === anchor.patch &&
    compareSemver(version, anchor) >= 0
  )
}

/** ~1.2.3 => >=1.2.3 <1.3.0; ~0.2.3 => >=0.2.3 <0.3.0 */
function satisfiesTilde(version: SemverParts, anchor: SemverParts): boolean {
  const upper = parseSemver(`${anchor.major}.${anchor.minor + 1}.0`)
  return (
    compareSemver(version, anchor) >= 0 && compareSemver(version, upper) < 0
  )
}

export function checkSemverRange(
  versionRaw: string,
  rangeRaw: string,
): SemverRangeCheck {
  const warnings: string[] = []
  const version = parseSemver(versionRaw)
  const { kind: rangeKind, version: anchor } = parseRange(rangeRaw)

  if (!versionRaw.trim() || !rangeRaw.trim()) {
    warnings.push("Enter a version and a range (e.g. ^1.2.3 or >=2.0.0).")
  } else {
    if (!version.valid) {
      warnings.push(`Version is not valid semver: "${version.raw}"`)
    }
    if (!anchor.valid) {
      warnings.push(`Range anchor is not valid semver: "${anchor.raw}"`)
    }
    if (!rangeKind && rangeRaw.trim()) {
      warnings.push("Range operator not recognized; use ^, ~, >=, >, <=, <, or exact.")
    }
  }

  let satisfies = false
  if (version.valid && anchor.valid && rangeKind) {
    const cmp = compareSemver(version, anchor)
    switch (rangeKind) {
      case "exact":
        satisfies = cmp === 0
        break
      case "caret":
        satisfies = satisfiesCaret(version, anchor)
        break
      case "tilde":
        satisfies = satisfiesTilde(version, anchor)
        break
      case "gte":
        satisfies = cmp >= 0
        break
      case "gt":
        satisfies = cmp > 0
        break
      case "lte":
        satisfies = cmp <= 0
        break
      case "lt":
        satisfies = cmp < 0
        break
    }
  }

  return {
    version,
    range: rangeRaw.trim(),
    rangeKind,
    satisfies,
    warnings,
  }
}

export function sortSemverLines(text: string): SemverSortResult {
  const warnings: string[] = []
  const lines = text.split(/\r?\n/)
  const versions: SemverParts[] = []
  const invalid: string[] = []

  for (const line of lines) {
    const token = line.trim()
    if (!token || token.startsWith("#")) continue
    const cleaned = token.replace(/^v/i, "")
    const parsed = parseSemver(cleaned)
    if (parsed.valid) {
      versions.push(parsed)
    } else {
      invalid.push(token)
    }
  }

  if (!text.trim()) {
    warnings.push("Paste one version per line to sort.")
  } else if (versions.length === 0) {
    warnings.push("No valid semver lines found.")
  }

  versions.sort(compareSemver)
  const sorted = versions.map((v) => v.raw)

  return { versions, sorted, invalid, warnings }
}

export function formatSemverCompareMarkdown(result: SemverCompareResult): string {
  if (!result.left.valid || !result.right.valid) {
    return "_Enter two valid semver strings._"
  }

  const relation =
    result.order === 0
      ? "equal"
      : result.order < 0
        ? `${result.left.raw} < ${result.right.raw}`
        : `${result.left.raw} > ${result.right.raw}`

  const bump =
    result.bump === "none"
      ? "same version"
      : `${result.bump} bump between versions`

  return [`**${relation}**`, "", `- Bump: ${bump}`].join("\n")
}
