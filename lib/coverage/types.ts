export type CoverageFile = {
  path: string
  statements: number | null
  branches: number | null
  functions: number | null
  lines: number | null
  uncoveredLines: string
  sourceLine: number
  raw: string
}

export type CoverageParseSummary = {
  fileCount: number
  avgLines: number | null
  belowThreshold: number
}

export type CoverageParseOptions = {
  hideNodeModules?: boolean
  extensionFilter?: string
  /** Include files at or below this lines % (0–100). Omit to show all parsed files. */
  maxLinesPct?: number
}

export type CoverageParseResult = {
  files: CoverageFile[]
  summary: CoverageParseSummary
  warnings: string[]
}
