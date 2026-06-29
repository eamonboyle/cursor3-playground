export type ContextSectionKind = "citation" | "path-header" | "plain"

export type ContextSection = {
  id: string
  kind: ContextSectionKind
  title: string
  content: string
  chars: number
  lines: number
  tokens: number
}

export type ContextBudgetId = "8k" | "32k" | "128k"

export type ContextBudget = {
  id: ContextBudgetId
  label: string
  limit: number
}

export type ContextBudgetStatus = {
  budget: ContextBudget
  totalTokens: number
  fits: boolean
  overBy: number
  fillPercent: number
}

export type ContextParseResult = {
  sections: ContextSection[]
  ranked: ContextSection[]
  totalChars: number
  totalLines: number
  totalTokens: number
  budgets: ContextBudgetStatus[]
  warnings: string[]
}

export type ContextPersisted = {
  input: string
}
