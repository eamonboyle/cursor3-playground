export type StackFrameKind = "v8" | "python" | "rust" | "plain"

export type StackFrame = {
  /** Repo-relative or absolute path when detected. */
  path: string
  line: number
  column?: number
  /** Function or method name when present. */
  symbol?: string
  kind: StackFrameKind
  /** 1-based line in the pasted stack text. */
  sourceLine: number
  raw: string
}

export type StackParseResult = {
  frames: StackFrame[]
  /** First occurrence wins; keyed by path:line. */
  unique: StackFrame[]
  skipped: number
  warnings: string[]
}

export type StackPersisted = {
  text: string
  hideNodeModules: boolean
  hideInternals: boolean
}
