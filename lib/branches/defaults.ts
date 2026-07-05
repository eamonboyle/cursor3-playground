/** Sample `git branch -vv` output for the demo textarea. */
export const SAMPLE_GIT_BRANCH_VERBOSE = `* main                              a1b2c3d4 [origin/main] chore: sync playground demos
  cursor/cursor-testing-utility-9c45 5b0acf81 [origin/cursor/cursor-testing-utility-9c45: ahead 2] feat: add branches lab
  feature/auth                       cafebabe [origin/feature/auth: behind 3] wip: session hook
  stale/local-only                   deadbeef old experiment
  merged/feature                     f00dface [origin/merged/feature: gone] merged work
+ chore/docs                         baadf00d [origin/chore/docs: gone] docs: update README
  remotes/origin/HEAD                -> origin/main
  remotes/origin/main                a1b2c3d4 chore: sync playground demos
  remotes/origin/cursor/cursor-testing-utility-9c45 3c4d5e6f feat: add branches lab
  remotes/origin/feature/auth        11111111 feat: login form
`

/** Sample plain `git branch -a` listing without tracking metadata. */
export const SAMPLE_GIT_BRANCH_PLAIN = `* main
  cursor/cursor-testing-utility-9c45
  feature/auth
  remotes/origin/HEAD -> origin/main
  remotes/origin/main
  remotes/origin/cursor/cursor-testing-utility-9c45
  remotes/origin/feature/auth
`
