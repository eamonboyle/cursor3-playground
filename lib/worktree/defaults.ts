/** Sample `git worktree list` output with multiple linked trees. */
export const SAMPLE_GIT_WORKTREE_LIST = `/Users/dev/my-app                    a1b2c3d [main]
/Users/dev/my-app-feature            e4f5a6b [cursor/worktree-lab]
/Users/dev/my-app-hotfix              c7d8e9f (detached HEAD)
/Users/dev/my-app-bare               (bare)
/Users/dev/my-app-stale              a0b1c2d [feature/old] prunable
/Users/dev/my-app-locked             f3e4d5c [release/1.0] locked
`

/** Sample `git worktree list --porcelain` output. */
export const SAMPLE_GIT_WORKTREE_PORCELAIN = `worktree /Users/dev/my-app
HEAD a1b2c3d4e5f6789012345678abcdef0123456789
branch refs/heads/main

worktree /Users/dev/my-app-feature
HEAD e4f5a6b4e5f6789012345678abcdef0123456789
branch refs/heads/cursor/worktree-lab

worktree /Users/dev/my-app-hotfix
HEAD c7d8e9f4e5f6789012345678abcdef0123456789
detached

worktree /Users/dev/my-app-bare
bare

worktree /Users/dev/my-app-stale
HEAD a0b1c2d4e5f6789012345678abcdef0123456789
branch refs/heads/feature/old
prunable

worktree /Users/dev/my-app-locked
HEAD f3e4d5c4e5f6789012345678abcdef0123456789
branch refs/heads/release/1.0
locked
`
