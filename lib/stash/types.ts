export type StashKind = "wip" | "on" | "untracked" | "autostash" | "unknown"

export type StashEntry = {
  index: number
  ref: string
  kind: StashKind
  branch?: string
  message: string
  sourceLine: number
  raw: string
}

export type StashListSummary = {
  total: number
  byKind: Record<StashKind, number>
}

export type StashListParseResult = {
  entries: StashEntry[]
  summary: StashListSummary
  warnings: string[]
}
