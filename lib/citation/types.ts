export type CitationBlock = {
  filepath: string
  startLine: number
  endLine: number
  code: string
  /** 1-based line in pasted source when parsed from scan input. */
  sourceLine?: number
  raw?: string
}

export type CitationParseResult = {
  citations: CitationBlock[]
  warnings: string[]
}

export type CitationBuildInput = {
  filepath: string
  startLine: number
  endLine: number
  code?: string
}
