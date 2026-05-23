export type PatchFileChange = {
  /** Display path (prefer +++ path when present). */
  path: string
  oldPath?: string
  newPath?: string
  additions: number
  deletions: number
  binary: boolean
  isNew: boolean
  isDeleted: boolean
  isRename: boolean
}

export type PatchParseResult = {
  files: PatchFileChange[]
  summary: {
    fileCount: number
    additions: number
    deletions: number
    binaryCount: number
  }
  warnings: string[]
}
