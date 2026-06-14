export type LocEntry = {
  path: string
  lines: number
  sourceLine: number
  raw: string
}

export type LocSummary = {
  fileCount: number
  totalLines: number
  byExtension: Record<string, number>
  byTopDir: Record<string, number>
}

export type LocParseResult = {
  entries: LocEntry[]
  summary: LocSummary
  warnings: string[]
}

export type LocParseOptions = {
  hideNodeModules?: boolean
  extensionFilter?: string
  minLines?: number
}
