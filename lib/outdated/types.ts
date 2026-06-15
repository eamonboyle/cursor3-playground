export type OutdatedBump = "major" | "minor" | "patch" | "prerelease" | "none"

export type OutdatedDepType = "dependencies" | "devDependencies" | "unknown"

export type OutdatedPackage = {
  name: string
  current: string
  latest: string
  wanted?: string
  depType: OutdatedDepType
  bump: OutdatedBump
  sourceLine: number
}

export type OutdatedSummary = {
  total: number
  byBump: Record<Exclude<OutdatedBump, "none">, number>
  safeCount: number
  majorCount: number
}

export type OutdatedParseResult = {
  packages: OutdatedPackage[]
  summary: OutdatedSummary
  warnings: string[]
}
