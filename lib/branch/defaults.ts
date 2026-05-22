import type { BranchPersisted } from "./types"

export function defaultBranchPersisted(): BranchPersisted {
  return {
    prefix: "cursor",
    maxLength: 50,
    title: "Add branch name lab for git-safe slugs",
  }
}
