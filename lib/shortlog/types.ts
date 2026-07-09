export type ShortlogFilter = "all" | "with-email" | "without-email"

export type ShortlogEntry = {
  count: number
  name: string
  email?: string
  sourceLine: number
  raw: string
}

export type ShortlogParseSummary = {
  authors: number
  totalCommits: number
  withEmail: number
  topAuthor?: string
  topCount: number
}

export type ShortlogFormat = "numbered" | "plain" | "mixed" | "unknown"

export type ShortlogParseResult = {
  entries: ShortlogEntry[]
  summary: ShortlogParseSummary
  format: ShortlogFormat
  warnings: string[]
}

export type ShortlogParseOptions = {
  filter?: ShortlogFilter
}
