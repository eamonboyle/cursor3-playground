import type {
  SemverBump,
  SemverBumpResult,
  SemverCompareResult,
  SemverIssue,
  SemverParseResult,
  SemverPart,
} from "./types"

/** Core `major.minor.patch` with optional `-prerelease` and `+build` (semver 2.0). */
const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

const PRERELEASE_ID_RE = /^(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)$/

function splitIdentifiers(value: string | undefined): string[] {
  if (!value) {
    return []
  }
  return value.split(".")
}

function isNumericId(id: string): boolean {
  return /^\d+$/.test(id)
}

function compareIdentifiers(left: string[], right: string[]): number {
  const max = Math.max(left.length, right.length)
  for (let i = 0; i < max; i++) {
    const a = left[i]
    const b = right[i]
    if (a === undefined) {
      return -1
    }
    if (b === undefined) {
      return 1
    }
    const aNum = isNumericId(a)
    const bNum = isNumericId(b)
    if (aNum && bNum) {
      const diff = Number(a) - Number(b)
      if (diff !== 0) {
        return diff < 0 ? -1 : 1
      }
      continue
    }
    if (aNum && !bNum) {
      return -1
    }
    if (!aNum && bNum) {
      return 1
    }
    if (a < b) {
      return -1
    }
    if (a > b) {
      return 1
    }
  }
  return 0
}

function formatPart(parts: SemverPart): string {
  let out = `${parts.major}.${parts.minor}.${parts.patch}`
  if (parts.prerelease.length > 0) {
    out += `-${parts.prerelease.join(".")}`
  }
  if (parts.build.length > 0) {
    out += `+${parts.build.join(".")}`
  }
  return out
}

function validateIdentifiers(
  ids: string[],
  label: string,
  issues: SemverIssue[],
): void {
  for (const id of ids) {
    if (!PRERELEASE_ID_RE.test(id)) {
      issues.push({
        level: "error",
        message: `Invalid ${label} identifier \`${id}\`.`,
      })
    }
    if (id.length > 0 && isNumericId(id) && id.length > 1 && id.startsWith("0")) {
      issues.push({
        level: "warn",
        message: `Numeric ${label} identifier \`${id}\` has a leading zero.`,
      })
    }
  }
}

/**
 * Parse and validate a semver string. Build metadata is preserved but ignored for ordering.
 */
export function parseSemver(input: string): SemverParseResult {
  const issues: SemverIssue[] = []
  const raw = input.trim()

  if (!raw) {
    return {
      valid: false,
      raw: "",
      normalized: "",
      parts: null,
      issues: [{ level: "warn", message: "Enter a version string to validate." }],
    }
  }

  if (raw.startsWith("v") || raw.startsWith("V")) {
    issues.push({
      level: "info",
      message: "Leading `v` is common in git tags but not part of semver — strip it for npm.",
    })
  }

  const candidate = raw.replace(/^[vV]/, "")
  const match = SEMVER_RE.exec(candidate)

  if (!match) {
    issues.push({
      level: "error",
      message:
        "Must match `major.minor.patch` with optional `-prerelease` and `+build` (no spaces).",
    })
    return {
      valid: false,
      raw,
      normalized: candidate,
      parts: null,
      issues,
    }
  }

  const parts: SemverPart = {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: splitIdentifiers(match[4]),
    build: splitIdentifiers(match[5]),
  }

  validateIdentifiers(parts.prerelease, "prerelease", issues)
  validateIdentifiers(parts.build, "build", issues)

  if (parts.prerelease.length > 0 && parts.prerelease[0] === "") {
    issues.push({
      level: "error",
      message: "Prerelease segment cannot be empty.",
    })
  }

  const hasErrors = issues.some((issue) => issue.level === "error")
  const normalized = formatPart(parts)

  return {
    valid: !hasErrors,
    raw,
    normalized,
    parts,
    issues,
  }
}

/**
 * Compare two semver strings. Build metadata does not affect ordering.
 */
export function compareSemver(left: string, right: string): SemverCompareResult {
  const issues: SemverIssue[] = []
  const leftParsed = parseSemver(left)
  const rightParsed = parseSemver(right)

  if (!leftParsed.valid) {
    issues.push({
      level: "error",
      message: `Left version is invalid: ${left.trim() || "(empty)"}`,
    })
  }
  if (!rightParsed.valid) {
    issues.push({
      level: "error",
      message: `Right version is invalid: ${right.trim() || "(empty)"}`,
    })
  }

  if (!leftParsed.parts || !rightParsed.parts) {
    return {
      valid: false,
      left: left.trim(),
      right: right.trim(),
      order: null,
      issues: [...issues, ...leftParsed.issues, ...rightParsed.issues],
    }
  }

  const a = leftParsed.parts
  const b = rightParsed.parts

  if (a.major !== b.major) {
    return {
      valid: true,
      left: leftParsed.normalized,
      right: rightParsed.normalized,
      order: a.major < b.major ? -1 : 1,
      issues,
    }
  }
  if (a.minor !== b.minor) {
    return {
      valid: true,
      left: leftParsed.normalized,
      right: rightParsed.normalized,
      order: a.minor < b.minor ? -1 : 1,
      issues,
    }
  }
  if (a.patch !== b.patch) {
    return {
      valid: true,
      left: leftParsed.normalized,
      right: rightParsed.normalized,
      order: a.patch < b.patch ? -1 : 1,
      issues,
    }
  }

  const aPre = a.prerelease
  const bPre = b.prerelease
  if (aPre.length === 0 && bPre.length === 0) {
    return {
      valid: true,
      left: leftParsed.normalized,
      right: rightParsed.normalized,
      order: 0,
      issues,
    }
  }
  if (aPre.length === 0 && bPre.length > 0) {
    return {
      valid: true,
      left: leftParsed.normalized,
      right: rightParsed.normalized,
      order: 1,
      issues,
    }
  }
  if (aPre.length > 0 && bPre.length === 0) {
    return {
      valid: true,
      left: leftParsed.normalized,
      right: rightParsed.normalized,
      order: -1,
      issues,
    }
  }

  const preOrder = compareIdentifiers(aPre, bPre)
  const order: -1 | 0 | 1 = preOrder < 0 ? -1 : preOrder > 0 ? 1 : 0

  return {
    valid: true,
    left: leftParsed.normalized,
    right: rightParsed.normalized,
    order,
    issues,
  }
}

/**
 * Bump a valid semver to the next major, minor, patch, or prerelease.
 */
export function bumpSemver(input: string, bump: SemverBump): SemverBumpResult {
  const parsed = parseSemver(input)
  const from = parsed.normalized || input.trim()

  if (!parsed.valid || !parsed.parts) {
    return {
      valid: false,
      from,
      to: "",
      bump,
      issues: parsed.issues.length
        ? parsed.issues
        : [{ level: "error", message: "Cannot bump an invalid version." }],
    }
  }

  const parts = { ...parsed.parts, prerelease: [...parsed.parts.prerelease], build: [] }

  switch (bump) {
    case "major":
      parts.major += 1
      parts.minor = 0
      parts.patch = 0
      parts.prerelease = []
      break
    case "minor":
      parts.minor += 1
      parts.patch = 0
      parts.prerelease = []
      break
    case "patch":
      parts.patch += 1
      parts.prerelease = []
      break
    case "prerelease": {
      if (parts.prerelease.length === 0) {
        parts.prerelease = ["0"]
      } else {
        const last = parts.prerelease[parts.prerelease.length - 1] ?? ""
        if (isNumericId(last)) {
          const next = [...parts.prerelease]
          next[next.length - 1] = String(Number(last) + 1)
          parts.prerelease = next
        } else {
          parts.prerelease = [...parts.prerelease, "0"]
        }
      }
      break
    }
  }

  return {
    valid: true,
    from,
    to: formatPart(parts),
    bump,
    issues: [],
  }
}

export function formatSemverReport(
  parsed: SemverParseResult,
  compare?: SemverCompareResult | null,
  bump?: SemverBumpResult | null,
): string {
  const lines: string[] = []
  lines.push(`Semver: **${parsed.valid ? "valid" : "invalid"}**`)
  if (parsed.normalized) {
    lines.push(`Version: \`${parsed.normalized}\``)
  }
  if (compare?.valid && compare.order !== null) {
    const rel =
      compare.order === 0
        ? "equal to"
        : compare.order < 0
          ? "older than"
          : "newer than"
    lines.push(`Compare: \`${compare.left}\` is ${rel} \`${compare.right}\``)
  }
  if (bump?.valid && bump.to) {
    lines.push(`Bump ${bump.bump}: \`${bump.from}\` → \`${bump.to}\``)
  }
  const issues = [
    ...parsed.issues,
    ...(compare?.issues ?? []),
    ...(bump?.issues ?? []),
  ]
  if (issues.length > 0) {
    lines.push("")
    for (const issue of issues) {
      const prefix =
        issue.level === "error" ? "✗" : issue.level === "warn" ? "!" : "·"
      lines.push(`${prefix} ${issue.message}`)
    }
  }
  return lines.join("\n")
}
