/** Sample CODEOWNERS file for the demo textarea. */
export const SAMPLE_CODEOWNERS = `# Default owners for everything in the repo
* @eamonboyle

# Playground hub and shared UI
/lib/playground/ @cursor-playground-team
/components/ui/ @design-systems

# Finance and habits product slices
/lib/finance/ @finance-squad
/components/finance/ @finance-squad
/lib/habits/ @habits-squad
/components/habits/ @habits-squad

# Git and CI tooling labs
/lib/git-*/ @devtools
/components/git-*/ @devtools
/lib/checks/ @devtools
/components/checks/ @devtools

# Tests must be reviewed by QA
**/*.test.ts @qa-team

# API routes
/app/api/ @platform-team
`

/** Sample changed paths from git diff --name-only. */
export const SAMPLE_CHANGED_PATHS = `lib/owners/parse.ts
lib/owners/parse.test.ts
lib/owners/types.ts
lib/owners/defaults.ts
components/owners/owners-app.tsx
app/owners/page.tsx
lib/playground/demos.ts
README.md
lib/finance/compute.ts
lib/git-status/parse.ts
app/api/rsvp/route.ts
`
