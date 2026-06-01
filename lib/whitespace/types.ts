export type LineEndingKind = "lf" | "crlf" | "cr" | "none"

export type IndentKind = "spaces" | "tabs" | "mixed" | "none"

export type WhitespaceIssueKind =
  | "mixed-line-endings"
  | "trailing-whitespace"
  | "mixed-indent"
  | "invisible-char"
  | "missing-final-newline"
  | "final-newline-only"

export type WhitespaceIssue = {
  kind: WhitespaceIssueKind
  line?: number
  column?: number
  message: string
  detail?: string
}

export type InvisibleCharHit = {
  line: number
  column: number
  codePoint: number
  label: string
}

export type WhitespaceParseSummary = {
  lineCount: number
  lineEnding: LineEndingKind
  lineEndingCounts: { lf: number; crlf: number; cr: number }
  trailingWhitespaceLines: number
  indent: IndentKind
  spaceIndentLines: number
  tabIndentLines: number
  invisibleCharCount: number
  hasFinalNewline: boolean
  endsWithBlankLine: boolean
}

export type WhitespaceParseResult = {
  summary: WhitespaceParseSummary
  issues: WhitespaceIssue[]
  invisibleHits: InvisibleCharHit[]
  warnings: string[]
}
