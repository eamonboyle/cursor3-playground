export type GitFileKind =
  | "added"
  | "modified"
  | "deleted"
  | "renamed"
  | "copied"
  | "untracked"
  | "ignored"
  | "conflicted"

export type GitStatusBucket =
  | "staged"
  | "unstaged"
  | "untracked"
  | "ignored"
  | "conflicted"

export type GitStatusEntry = {
  path: string
  oldPath?: string
  kind: GitFileKind
  buckets: GitStatusBucket[]
  indexCode?: string
  worktreeCode?: string
  sourceLine: number
  raw: string
}

export type GitStatusSummary = {
  total: number
  staged: number
  unstaged: number
  untracked: number
  ignored: number
  conflicted: number
  byKind: Record<GitFileKind, number>
}

export type GitStatusParseResult = {
  entries: GitStatusEntry[]
  summary: GitStatusSummary
  branch?: string
  format: "porcelain" | "human" | "mixed" | "unknown"
  warnings: string[]
}
