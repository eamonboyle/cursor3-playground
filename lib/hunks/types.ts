export type DiffHunk = {
  /** Display path (prefer +++ path when present). */
  path: string
  /** 1-based index within the file's hunks. */
  hunkIndex: number
  oldStart: number
  oldCount: number
  newStart: number
  newCount: number
  additions: number
  deletions: number
  /** Trailing context after the @@ header, if any. */
  context?: string
  /** 1-based line in the pasted input where the hunk header appeared. */
  sourceLine: number
  binary: boolean
  isNew: boolean
  isDeleted: boolean
}

export type HunksParseResult = {
  hunks: DiffHunk[]
  summary: {
    fileCount: number
    hunkCount: number
    additions: number
    deletions: number
    binaryCount: number
  }
  warnings: string[]
}
