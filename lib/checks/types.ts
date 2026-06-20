export type CheckStatus =
  | "pass"
  | "fail"
  | "pending"
  | "skipped"
  | "cancelled"
  | "unknown"

export type CiCheck = {
  name: string
  status: CheckStatus
  description?: string
  elapsed?: string
  url?: string
  /** 1-based line in pasted output. */
  sourceLine: number
  raw: string
}

export type ChecksSummary = {
  pass: number
  fail: number
  pending: number
  skipped: number
  cancelled: number
  unknown: number
}

export type ChecksParseResult = {
  checks: CiCheck[]
  summary: ChecksSummary
  /** e.g. "Some checks were not successful" from gh pr checks. */
  headline?: string
  warnings: string[]
}
