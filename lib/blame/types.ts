export type BlameLine = {
  line: number
  hash: string
  shortHash: string
  author: string
  date: string
  time: string
  timezone: string
  content: string
  isBoundary: boolean
  sourceLine: number
  raw: string
}

export type BlameLineRange = {
  start: number
  end: number
  hash: string
  shortHash: string
}

export type BlameAuthorGroup = {
  author: string
  lineCount: number
  ranges: BlameLineRange[]
  hashes: string[]
}

export type BlameSummary = {
  totalLines: number
  authorCount: number
  uniqueCommits: number
  byAuthor: Record<string, number>
}

export type BlameParseResult = {
  lines: BlameLine[]
  groups: BlameAuthorGroup[]
  summary: BlameSummary
  filepath?: string
  warnings: string[]
}

export type BlameParseOptions = {
  authorFilter?: string
  filepath?: string
}
