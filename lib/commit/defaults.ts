import type { CommitPersisted } from "./types"

export function defaultCommitPersisted(): CommitPersisted {
  return { draft: "" }
}

/** Sample commit message for the commit lab demo. */
export const SAMPLE_COMMIT_MESSAGE = `feat(commit): add conventional commit message linter

Validate type, scope, subject length, and body wrapping before you push.
Pairs with branch name lab and patch lab for contributor workflow checks.

BREAKING CHANGE: none in this demo — footer shown for parsing only.
`
