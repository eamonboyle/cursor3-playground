export type LsRemoteRefKind =
  | "head"
  | "branch"
  | "tag"
  | "tag-peeled"
  | "other"

export type LsRemoteFilter =
  | "all"
  | "branches"
  | "tags"
  | "head"
  | "other"

export type LsRemoteEntry = {
  hash: string
  shortHash: string
  ref: string
  name: string
  kind: LsRemoteRefKind
  isSemver: boolean
  isAnnotatedTag?: boolean
  peeledHash?: string
  sourceLine: number
  raw: string
}

export type LsRemoteParseSummary = {
  total: number
  branches: number
  tags: number
  peeled: number
  semverTags: number
  headHash?: string
  defaultBranch?: string
}

export type LsRemoteParseResult = {
  entries: LsRemoteEntry[]
  summary: LsRemoteParseSummary
  warnings: string[]
}

export type LsRemoteParseOptions = {
  filter?: LsRemoteFilter
}
