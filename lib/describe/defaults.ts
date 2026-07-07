/** Sample `git describe --tags --long` output from a release branch. */
export const SAMPLE_GIT_DESCRIBE_LONG = `v1.4.2
v1.4.2-12-g3c4d5e6
v1.4.2-12-g3c4d5e6f7890abcd1234567890abcd123456
release-candidate-2-3-gabcdef0
a1b2c3d4e5f6789012345678901234567890abcd`

/** Shorter describe without --long (no trailing -g hash). */
export const SAMPLE_GIT_DESCRIBE_SHORT = `v2.0.0
v2.0.0-7
nightly-2026-07-01-4`
