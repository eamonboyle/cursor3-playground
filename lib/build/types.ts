export type BuildErrorKind =
  | "type-error"
  | "module-not-found"
  | "compile-error"
  | "syntax-error"
  | "other"

export type BuildError = {
  path?: string
  line?: number
  column?: number
  kind: BuildErrorKind
  message: string
  /** Optional missing module name for module-not-found errors. */
  module?: string
  /** 1-based line in pasted build log. */
  sourceLine: number
  raw: string
}

export type BuildParseResult = {
  errors: BuildError[]
  /** First occurrence per path:line:kind (or message-only for globals). */
  unique: BuildError[]
  summary: {
    total: number
    byKind: Record<BuildErrorKind, number>
    byFile: Record<string, number>
  }
  /** Distinct file paths with at least one located error. */
  fileCount: number
  warnings: string[]
}
