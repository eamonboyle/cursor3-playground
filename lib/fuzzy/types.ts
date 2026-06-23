export type FuzzyMatchReason =
  | "exact"
  | "case-insensitive"
  | "basename"
  | "suffix"
  | "levenshtein"

export type FuzzyMatch = {
  path: string
  score: number
  distance: number
  reason: FuzzyMatchReason
}

export type FuzzyQueryResult = {
  query: string
  matches: FuzzyMatch[]
  warnings: string[]
}

export type FuzzyMatchBatchResult = {
  queries: FuzzyQueryResult[]
  candidates: string[]
  warnings: string[]
}
