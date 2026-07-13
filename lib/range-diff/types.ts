export type RangeDiffComparison = "equal" | "modified" | "added" | "removed"

export type RangeDiffComparisonSymbol = "=" | "!" | "<" | ">"

export type RangeDiffFilter =
  | "all"
  | "equal"
  | "modified"
  | "added"
  | "removed"

export type RangeDiffSide = {
  position?: number
  hash?: string
  shortHash?: string
  placeholder: boolean
}

export type RangeDiffEntry = {
  comparison: RangeDiffComparison
  comparisonSymbol: RangeDiffComparisonSymbol
  left: RangeDiffSide
  right: RangeDiffSide
  subject: string
  sourceLine: number
  raw: string
  hasPatch: boolean
  patchLines: number
}

export type RangeDiffParseSummary = {
  total: number
  equal: number
  modified: number
  added: number
  removed: number
  withPatch: number
}

export type RangeDiffParseResult = {
  entries: RangeDiffEntry[]
  summary: RangeDiffParseSummary
  warnings: string[]
}

export type RangeDiffParseOptions = {
  filter?: RangeDiffFilter
}
