export type SemverParts = {
  raw: string
  valid: boolean
  major: number
  minor: number
  patch: number
  /** Dot-separated prerelease identifiers (empty if release). */
  prerelease: string[]
  /** Dot-separated build metadata (ignored for ordering). */
  build: string[]
}

export type SemverCompare = -1 | 0 | 1

export type SemverBump = "major" | "minor" | "patch" | "prerelease" | "none"

export type SemverCompareResult = {
  left: SemverParts
  right: SemverParts
  order: SemverCompare
  bump: SemverBump
  warnings: string[]
}

export type SemverRangeKind = "exact" | "caret" | "tilde" | "gte" | "gt" | "lte" | "lt"

export type SemverRangeCheck = {
  version: SemverParts
  range: string
  rangeKind: SemverRangeKind | null
  satisfies: boolean
  warnings: string[]
}

export type SemverSortResult = {
  versions: SemverParts[]
  sorted: string[]
  invalid: string[]
  warnings: string[]
}
