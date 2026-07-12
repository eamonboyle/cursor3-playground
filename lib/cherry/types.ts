export type CherrySign = "unique" | "equivalent"

export type CherryFilter = "all" | "unique" | "equivalent"

export type CherryEntry = {
  sign: CherrySign
  hash: string
  shortHash: string
  subject?: string
  sourceLine: number
  raw: string
}

export type CherryParseSummary = {
  total: number
  unique: number
  equivalent: number
  hasSubjects: boolean
}

export type CherryFormat = "verbose" | "plain" | "mixed" | "unknown"

export type CherryParseResult = {
  entries: CherryEntry[]
  summary: CherryParseSummary
  format: CherryFormat
  warnings: string[]
}

export type CherryParseOptions = {
  filter?: CherryFilter
}
