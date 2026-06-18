export const GIT_LOG_COMMIT_TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
] as const

export type GitLogCommitType = (typeof GIT_LOG_COMMIT_TYPES)[number]

export type GitLogEntry = {
  hash: string
  shortHash: string
  subject: string
  type?: GitLogCommitType | "other"
  scope?: string
  breaking: boolean
  isMerge: boolean
  sourceLine: number
  raw: string
}

export type GitLogParseSummary = {
  commitCount: number
  byType: Record<string, number>
  breakingCount: number
  mergeCount: number
}

export type GitLogParseResult = {
  commits: GitLogEntry[]
  summary: GitLogParseSummary
  warnings: string[]
}

export type GitLogParseOptions = {
  hideMerges?: boolean
  typeFilter?: string
}
