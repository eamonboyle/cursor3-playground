/** Sample `git cherry -v origin/main` output — unique (+) and equivalent (-) commits. */
export const SAMPLE_GIT_CHERRY_VERBOSE = `+ a1b2c3d4e5f6789012345678abcdef0123456789 feat: add session refresh hook
+ f0e1d2c3b4a5968776655443322110099887766 fix: guard null user in profile route
- c9d8e7f6a5b4938271605948372615049382716 chore: bump eslint config (patch-equivalent upstream)
+ 1234567890abcdef1234567890abcdef12345678 docs: update README quick start section
- fedcba0987654321fedcba0987654321fedcba09 refactor: extract parse helpers (already on main)`

/** Sample `git cherry origin/main` output — hashes only, no subjects. */
export const SAMPLE_GIT_CHERRY_PLAIN = `+ a1b2c3d4e5f6789012345678abcdef0123456789
+ f0e1d2c3b4a5968776655443322110099887766
- c9d8e7f6a5b4938271605948372615049382716
+ 1234567890abcdef1234567890abcdef12345678
- fedcba0987654321fedcba0987654321fedcba09`
