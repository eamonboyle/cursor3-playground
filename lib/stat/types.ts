export type StatFileEntry = {
  path: string
  additions: number
  deletions: number
  binary: boolean
  /** True when counts come from --numstat (exact) vs --stat bar graph (may be scaled). */
  exact: boolean
  sourceLine: number
  raw: string
}

export type StatParseOptions = {
  hideNodeModules?: boolean
  extensionFilter?: string
}

export type StatParseResult = {
  files: StatFileEntry[]
  summary: {
    fileCount: number
    additions: number
    deletions: number
    binaryCount: number
    reportedFileCount?: number
    reportedAdditions?: number
    reportedDeletions?: number
  }
  format: "numstat" | "stat" | "mixed" | "unknown"
  warnings: string[]
}
