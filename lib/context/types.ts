export type ContextSectionKind = "citation" | "path-header" | "chunk"

export type ContextSection = {
  kind: ContextSectionKind
  label: string
  text: string
  charCount: number
  tokenEstimate: number
  /** 1-based line where this section starts in the pasted input. */
  sourceStartLine: number
}

export type ContextBudget = {
  limit: number
  label: string
  percentUsed: number
  exceeded: boolean
}

export type ContextParseSummary = {
  totalChars: number
  totalTokens: number
  sectionCount: number
}

export type ContextParseResult = {
  sections: ContextSection[]
  summary: ContextParseSummary
  budgets: ContextBudget[]
  warnings: string[]
}
