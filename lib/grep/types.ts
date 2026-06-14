export type GrepHitKind = "match" | "context"

export type GrepHit = {
  path: string
  line: number
  column?: number
  kind: GrepHitKind
  text: string
  sourceLine: number
  raw: string
}

export type GrepFileGroup = {
  path: string
  hits: GrepHit[]
}

export type GrepParseSummary = {
  total: number
  matchCount: number
  contextCount: number
  fileCount: number
  byExtension: Record<string, number>
}

export type GrepParseResult = {
  hits: GrepHit[]
  groups: GrepFileGroup[]
  summary: GrepParseSummary
  warnings: string[]
}

export type GrepParseOptions = {
  hideNodeModules?: boolean
  extensionFilter?: string
  matchesOnly?: boolean
}
