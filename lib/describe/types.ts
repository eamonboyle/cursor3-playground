export const DESCRIBE_KINDS = [
  "exact-tag",
  "ahead-of-tag",
  "hash-only",
  "unknown",
] as const

export type DescribeKind = (typeof DESCRIBE_KINDS)[number]

export type DescribeFilter = "all" | DescribeKind

export type DescribeEntry = {
  raw: string
  kind: DescribeKind
  tag?: string
  commitsAhead?: number
  hash?: string
  isSemverTag: boolean
  sourceLine: number
}

export type DescribeParseSummary = {
  total: number
  exactTag: number
  aheadOfTag: number
  hashOnly: number
  semver: number
}

export type DescribeParseResult = {
  entries: DescribeEntry[]
  summary: DescribeParseSummary
  warnings: string[]
}

export type DescribeParseOptions = {
  filter?: DescribeFilter
}
