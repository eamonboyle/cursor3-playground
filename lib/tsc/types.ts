export type TscSeverity = "error" | "warning"

export type TscDiagnostic = {
  path?: string
  line?: number
  column?: number
  severity: TscSeverity
  /** e.g. TS2345 */
  code: string
  message: string
  /** 1-based line in pasted compiler output. */
  sourceLine: number
  raw: string
}

export type TscParseResult = {
  diagnostics: TscDiagnostic[]
  /** First occurrence per path:line:code (or code-only for globals). */
  unique: TscDiagnostic[]
  summary: {
    errors: number
    warnings: number
    byCode: Record<string, number>
  }
  /** Distinct file paths with at least one located diagnostic. */
  fileCount: number
  warnings: string[]
}
