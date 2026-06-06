export type TestOutputFormat =
  | "node-tap"
  | "vitest"
  | "jest"
  | "stack"

export type TestFailure = {
  path?: string
  line?: number
  column?: number
  /** Parent describe/suite when detected. */
  suite?: string
  /** Test or subtest name. */
  name: string
  message?: string
  /** e.g. ERR_ASSERTION or AssertionError */
  code?: string
  format: TestOutputFormat
  /** 1-based line in pasted output. */
  sourceLine: number
  raw: string
}

export type TestParseResult = {
  failures: TestFailure[]
  /** First occurrence per path:line:name. */
  unique: TestFailure[]
  summary: {
    failed: number
    passed?: number
    total?: number
    skipped?: number
    byFile: Record<string, number>
  }
  /** Distinct file paths with at least one located failure. */
  fileCount: number
  warnings: string[]
}
