export type PlaywrightFailure = {
  path?: string
  line?: number
  column?: number
  /** Browser or project name when present, e.g. chromium. */
  project?: string
  /** Parent describe block(s) when detected. */
  suite?: string
  /** Test title. */
  name: string
  message?: string
  /** 1-based line in pasted output. */
  sourceLine: number
  raw: string
  /** Where this row was parsed from; used for deduplication. */
  origin: "inline" | "numbered" | "summary"
}

export type PlaywrightParseResult = {
  failures: PlaywrightFailure[]
  /** First occurrence per path:line:name. */
  unique: PlaywrightFailure[]
  summary: {
    failed: number
    passed?: number
    total?: number
    byFile: Record<string, number>
    byProject: Record<string, number>
  }
  /** Distinct file paths with at least one located failure. */
  fileCount: number
  warnings: string[]
}
