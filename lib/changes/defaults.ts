/** Sample `git diff --name-status main...HEAD` output for the demo textarea. */
export const SAMPLE_CHANGES_NAME_STATUS = `M	lib/playground/demos.ts
A	lib/changes/parse.ts
A	lib/changes/parse.test.ts
A	lib/changes/types.ts
A	lib/changes/defaults.ts
A	components/changes/changes-app.tsx
A	app/changes/page.tsx
D	lib/legacy/old-helper.ts
R100	lib/utils/format.ts	lib/utils/format-path.ts
M	package.json
M	node_modules/foo/index.js
`

/** Sample `git diff --name-only` output. */
export const SAMPLE_CHANGES_NAME_ONLY = `app/page.tsx
components/nav/nav.tsx
lib/api/client.ts
`
