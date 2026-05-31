export type SemverBump = "major" | "minor" | "patch" | "prerelease"

export type SemverPart = {
  major: number
  minor: number
  patch: number
  prerelease: string[]
  build: string[]
}

export type SemverIssue = {
  level: "error" | "warn" | "info"
  message: string
}

export type SemverParseResult = {
  valid: boolean
  raw: string
  normalized: string
  parts: SemverPart | null
  issues: SemverIssue[]
}

export type SemverCompareResult = {
  valid: boolean
  left: string
  right: string
  /** -1 if left < right, 0 if equal, 1 if left > right */
  order: -1 | 0 | 1 | null
  issues: SemverIssue[]
}

export type SemverBumpResult = {
  valid: boolean
  from: string
  to: string
  bump: SemverBump
  issues: SemverIssue[]
}
