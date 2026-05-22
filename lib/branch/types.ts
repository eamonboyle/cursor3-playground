export type BranchPrefix = "" | "feat" | "fix" | "chore" | "cursor"

export type BranchPersisted = {
  prefix: BranchPrefix
  maxLength: number
  title: string
}

export type BranchNameResult = {
  branch: string
  slug: string
  warnings: string[]
}
