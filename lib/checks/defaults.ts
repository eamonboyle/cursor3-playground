/** Sample `gh pr checks` table output for the demo textarea. */
export const SAMPLE_GH_PR_CHECKS = `Some checks were not successful
0 cancelled, 2 failing, 3 successful, 0 skipped, and 1 pending checks

   NAME                              DESCRIPTION                       ELAPSED  URL
X  lint (pull_request)               Process completed with errors.    1m12s    https://github.com/acme/app/actions/runs/123/job/456
X  build (pull_request)              Process completed with errors.    3m02s    https://github.com/acme/app/actions/runs/123/job/457
✓  typecheck (pull_request)          Process completed successfully.   45s      https://github.com/acme/app/actions/runs/123/job/458
✓  test (pull_request)               Process completed successfully.   2m10s    https://github.com/acme/app/actions/runs/123/job/459
✓  Vercel                            Deployment has completed          1m30s    https://vercel.com/acme/app/abc123
-  deploy-preview (pull_request)     Skipped                           0        https://github.com/acme/app/actions/runs/123/job/460
*  e2e (pull_request)                In progress                                https://github.com/acme/app/actions/runs/123/job/461
`

/** Compact status lines (CI bots, PR comment footers). */
export const SAMPLE_STATUS_LINES = `CI / lint (pull_request) Failing after 1m
CI / typecheck (pull_request) Successful in 45s
CI / test (pull_request) Successful in 2m
CI / build (pull_request) Failing after 3m
`
