export const BRANCH_KINDS = ["local", "remote"] as const

export type BranchKind = (typeof BRANCH_KINDS)[number]

export const BRANCH_TRACKING_STATES = [
  "none",
  "synced",
  "ahead",
  "behind",
  "diverged",
  "gone",
] as const

export type BranchTrackingState = (typeof BRANCH_TRACKING_STATES)[number]

export type BranchEntry = {
  name: string
  displayName: string
  kind: BranchKind
  isCurrent: boolean
  isMerged: boolean
  hash?: string
  tracking?: string
  ahead?: number
  behind?: number
  trackingState: BranchTrackingState
  subject?: string
  sourceLine: number
  raw: string
}

export type BranchParseSummary = {
  total: number
  local: number
  remote: number
  current?: string
  gone: number
  ahead: number
  behind: number
}

export type BranchParseResult = {
  entries: BranchEntry[]
  summary: BranchParseSummary
  format: "verbose" | "plain" | "mixed" | "unknown"
  warnings: string[]
}

export type BranchFilter = BranchKind | "all" | "current" | "gone" | "ahead" | "behind"

export type BranchParseOptions = {
  filter?: BranchFilter
}
