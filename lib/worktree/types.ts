export type WorktreeState =
  | "normal"
  | "bare"
  | "detached"
  | "locked"
  | "prunable"

export type WorktreeFilter =
  | "all"
  | "normal"
  | "bare"
  | "detached"
  | "locked"
  | "prunable"

export type WorktreeFormat = "list" | "porcelain" | "mixed" | "unknown"

export type WorktreeEntry = {
  path: string
  shortHash?: string
  branch?: string
  ref?: string
  state: WorktreeState
  isMain?: boolean
  sourceLine: number
  raw: string
}

export type WorktreeParseSummary = {
  total: number
  normal: number
  bare: number
  detached: number
  locked: number
  prunable: number
  mainPath?: string
}

export type WorktreeParseResult = {
  entries: WorktreeEntry[]
  summary: WorktreeParseSummary
  format: WorktreeFormat
  warnings: string[]
}

export type WorktreeParseOptions = {
  filter?: WorktreeFilter
}
