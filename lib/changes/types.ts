export type ChangeStatus =
  | "added"
  | "modified"
  | "deleted"
  | "renamed"
  | "copied"
  | "typechanged"
  | "unmerged"

export type ChangedFile = {
  status: ChangeStatus
  path: string
  oldPath?: string
  similarity?: number
  sourceLine: number
  raw: string
}

export type ChangesSummary = {
  total: number
  byStatus: Record<ChangeStatus, number>
  byExtension: Record<string, number>
}

export type ChangesParseResult = {
  files: ChangedFile[]
  summary: ChangesSummary
  warnings: string[]
}

export type ChangesParseOptions = {
  hideNodeModules?: boolean
  statusFilter?: ChangeStatus | "all"
  extensionFilter?: string
}
