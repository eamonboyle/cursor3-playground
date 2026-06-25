export type StashKind = "wip" | "branch" | "untracked" | "custom"

export type StashEntry = {
  index: number
  ref: string
  kind: StashKind
  branch?: string
  commit?: string
  message: string
  sourceLine: number
  raw: string
}

export type StashSummary = {
  total: number
  byKind: Record<StashKind, number>
  branches: string[]
}

export type StashParseResult = {
  entries: StashEntry[]
  summary: StashSummary
  warnings: string[]
}
