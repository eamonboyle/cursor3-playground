export const REFLOG_OPERATIONS = [
  "commit",
  "checkout",
  "reset",
  "merge",
  "rebase",
  "cherry-pick",
  "pull",
  "branch",
  "other",
] as const

export type ReflogOperation = (typeof REFLOG_OPERATIONS)[number]

export type ReflogEntry = {
  hash: string
  shortHash: string
  reflogIndex: number
  refName: string
  action: string
  description: string
  operation: ReflogOperation
  sourceLine: number
  raw: string
}

export type ReflogParseSummary = {
  entryCount: number
  byOperation: Record<ReflogOperation, number>
}

export type ReflogParseResult = {
  entries: ReflogEntry[]
  summary: ReflogParseSummary
  warnings: string[]
}

export type ReflogParseOptions = {
  operationFilter?: ReflogOperation | "all"
}
