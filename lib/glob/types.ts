export type GlobPatternKind = "include" | "exclude"

export type GlobPatternLine = {
  raw: string
  pattern: string
  kind: GlobPatternKind
  /** 1-based line in the patterns textarea (comments skipped). */
  line?: number
}

export type GlobPathMatch = {
  path: string
  matchedBy: string[]
  excludedBy: string[]
}

export type GlobFilterResult = {
  paths: string[]
  patterns: GlobPatternLine[]
  included: GlobPathMatch[]
  excluded: GlobPathMatch[]
  unmatched: string[]
  warnings: string[]
}
