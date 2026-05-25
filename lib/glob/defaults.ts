/** Sample repo paths for the glob scope lab demo. */
export const SAMPLE_REPO_PATHS = `app/page.tsx
app/glob/page.tsx
app/commit/page.tsx
components/glob/glob-app.tsx
components/commit/commit-app.tsx
lib/glob/filter.ts
lib/glob/match.test.ts
lib/commit/parse.ts
lib/commit/parse.test.ts
lib/playground/demos.ts
package.json
pnpm-lock.yaml
README.md
public/favicon.ico
`

/** Sample glob patterns (include + exclude). */
export const SAMPLE_GLOB_PATTERNS = `# Agent / test scope examples
lib/**/*.test.ts
components/**/*.tsx
!lib/playground/**
**/*.md
`
