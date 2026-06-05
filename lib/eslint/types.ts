export type EslintSeverity = "error" | "warning"

export type EslintDiagnostic = {
  path?: string
  line?: number
  column?: number
  severity: EslintSeverity
  /** e.g. @typescript-eslint/no-unused-vars */
  rule: string
  message: string
  /** 1-based line in pasted linter output. */
  sourceLine: number
  raw: string
}

export type EslintParseResult = {
  diagnostics: EslintDiagnostic[]
  /** First occurrence per path:line:rule (or rule-only for globals). */
  unique: EslintDiagnostic[]
  summary: {
    errors: number
    warnings: number
    byRule: Record<string, number>
  }
  /** Distinct file paths with at least one located diagnostic. */
  fileCount: number
  warnings: string[]
}
