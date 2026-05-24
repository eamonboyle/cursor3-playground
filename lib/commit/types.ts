export type CommitType =
  | "feat"
  | "fix"
  | "docs"
  | "style"
  | "refactor"
  | "perf"
  | "test"
  | "build"
  | "ci"
  | "chore"
  | "revert"

export type CommitIssueLevel = "error" | "warn" | "info"

export type CommitIssue = {
  level: CommitIssueLevel
  message: string
  line?: number
}

export type CommitParseResult = {
  valid: boolean
  type?: CommitType
  scope?: string
  breaking: boolean
  subject: string
  body: string
  footer: string
  subjectLength: number
  bodyLineCount: number
  issues: CommitIssue[]
}

export type CommitPersisted = {
  draft: string
}
