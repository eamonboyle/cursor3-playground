export type PrettierFileEntry = {
  path: string
  sourceLine: number
  raw: string
}

export type PrettierParseSummary = {
  fileCount: number
  byExtension: Record<string, number>
  allFormatted: boolean
}

export type PrettierParseResult = {
  files: PrettierFileEntry[]
  summary: PrettierParseSummary
  warnings: string[]
}

export type PrettierParseOptions = {
  hideNodeModules?: boolean
  extensionFilter?: string
}
