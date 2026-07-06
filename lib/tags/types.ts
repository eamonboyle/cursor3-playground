export type TagKind = "annotated" | "lightweight"

export type TagEntry = {
  name: string
  message?: string
  hash?: string
  date?: string
  kind: TagKind
  isSemver: boolean
  sourceLine: number
  raw: string
}

export type TagFilter = "all" | "annotated" | "lightweight" | "semver"

export type TagParseFormat = "plain" | "annotated" | "format" | "mixed" | "unknown"

export type TagParseSummary = {
  total: number
  annotated: number
  lightweight: number
  semver: number
}

export type TagParseResult = {
  entries: TagEntry[]
  summary: TagParseSummary
  format: TagParseFormat
  warnings: string[]
}

export type TagParseOptions = {
  filter?: TagFilter
}
