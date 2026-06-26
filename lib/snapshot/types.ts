export type SnapshotFailureKind = "mismatch" | "obsolete" | "new" | "inline"

export type SnapshotFailure = {
  path?: string
  suite?: string
  testName?: string
  snapshotName?: string
  snapshotPath?: string
  kind: SnapshotFailureKind
  removedLines?: number
  addedLines?: number
  sourceLine: number
  raw: string
}

export type SnapshotParseSummary = {
  total: number
  failed: number
  obsolete: number
  updated: number
  written: number
  byFile: Record<string, number>
}

export type SnapshotParseOptions = {
  hideNodeModules?: boolean
}

export type SnapshotParseResult = {
  failures: SnapshotFailure[]
  summary: SnapshotParseSummary
  warnings: string[]
}
