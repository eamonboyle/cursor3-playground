export type ConflictBlock = {
  /** 1-based index among parsed blocks in paste order. */
  index: number
  /** Line number of the `<<<<<<<` marker (1-based). */
  startLine: number
  /** Line number of the `=======` separator (1-based). */
  separatorLine: number
  /** Line number of the `>>>>>>>` marker (1-based). */
  endLine: number
  /** Label after `<<<<<<<` (e.g. HEAD), or empty. */
  oursLabel: string
  /** Label after `>>>>>>>` (branch name), or empty. */
  theirsLabel: string
  oursLineCount: number
  theirsLineCount: number
  oursContent: string
  theirsContent: string
}

export type ConflictIssueKind =
  | "orphan-start"
  | "orphan-separator"
  | "orphan-end"
  | "incomplete-block"

export type ConflictIssue = {
  kind: ConflictIssueKind
  line: number
  message: string
}

export type ConflictParseSummary = {
  conflictCount: number
  totalOursLines: number
  totalTheirsLines: number
  issueCount: number
}

export type ConflictParseResult = {
  blocks: ConflictBlock[]
  issues: ConflictIssue[]
  summary: ConflictParseSummary
  warnings: string[]
}
