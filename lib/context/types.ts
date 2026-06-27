export type TokenEstimateMethod = "chars" | "words"

export type ContextSection = {
  label: string
  content: string
  chars: number
  lines: number
  words: number
  tokens: number
  percentOfTotal: number
}

export type ContextBudgetStatus = "ok" | "warn" | "over"

export type ContextBudgetRow = {
  label: string
  limit: number
  status: ContextBudgetStatus
  headroom: number
}

export type ContextParseSummary = {
  sectionCount: number
  chars: number
  lines: number
  words: number
  tokens: number
  largestSection: string | null
}

export type ContextParseOptions = {
  tokenMethod?: TokenEstimateMethod
  charsPerToken?: number
  wordsPerToken?: number
}

export type ContextParseResult = {
  sections: ContextSection[]
  summary: ContextParseSummary
  budgets: ContextBudgetRow[]
  warnings: string[]
}

export type ContextPersisted = {
  input: string
  tokenMethod: TokenEstimateMethod
  budgetLimit: number
}
