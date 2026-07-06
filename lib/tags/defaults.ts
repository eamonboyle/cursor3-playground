/** Sample `git tag -l -n` output for the demo textarea. */
export const SAMPLE_GIT_TAG_ANNOTATED = `v0.0.1        Initial playground release
v1.0.0        First stable hub and command palette
v1.1.0        Git branches and reflog labs
cursor-test   Automation smoke tag without semver
`

/** Sample plain `git tag` list. */
export const SAMPLE_GIT_TAG_PLAIN = `v0.0.1
v1.0.0
v1.1.0
cursor-test
`

/** Sample `git tag --sort=-creatordate --format` output. */
export const SAMPLE_GIT_TAG_FORMAT = `v1.1.0 a1b2c3d 2026-07-05 Git branches and reflog labs
v1.0.0 d4e5f6a 2026-06-20 First stable hub and command palette
v0.0.1 9f8e7d6 2026-06-01 Initial playground release
cursor-test 1234567 2026-05-15 Automation smoke tag without semver
`
