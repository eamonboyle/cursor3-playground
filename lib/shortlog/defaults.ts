/** Sample `git shortlog -sn main..HEAD` output. */
export const SAMPLE_GIT_SHORTLOG_NUMBERED = `    42  Jane Smith
    28  John Doe
    15  Alex Chen
     8  Cursor Agent
     3  dependabot[bot]
`

/** Sample `git shortlog -sne v1.0.0..HEAD` output with emails. */
export const SAMPLE_GIT_SHORTLOG_EMAIL = `    42  Jane Smith <jane@example.com>
    28  John Doe <john@example.com>
    15  Alex Chen <alex@example.com>
     8  Cursor Agent <noreply@cursor.com>
     3  dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>
`
