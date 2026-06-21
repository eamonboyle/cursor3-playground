export type CodeownersRule = {
  pattern: string
  owners: string[]
  line: number
  raw: string
}

export type FileOwnerMatch = {
  path: string
  owners: string[]
  matchedPattern?: string
  ruleLine?: number
}

export type OwnerGroup = {
  owner: string
  paths: string[]
}

export type CodeownersSummary = {
  totalPaths: number
  owned: number
  unowned: number
  uniqueOwners: number
  ruleCount: number
}

export type CodeownersResult = {
  rules: CodeownersRule[]
  matches: FileOwnerMatch[]
  byOwner: OwnerGroup[]
  unowned: string[]
  warnings: string[]
  summary: CodeownersSummary
}
