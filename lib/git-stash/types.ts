export type GitStashKind = "wip" | "on" | "custom"

export type GitStashEntry = {
  index: number
  ref: string
  kind: GitStashKind
  branch?: string
  commit?: string
  message: string
  sourceLine: number
  raw: string
}

export type GitStashSummary = {
  total: number
  wip: number
  on: number
  custom: number
}

export type GitStashParseResult = {
  entries: GitStashEntry[]
  summary: GitStashSummary
  warnings: string[]
}
