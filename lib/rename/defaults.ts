/** Sample rename rules after moving a lib folder. */
export const SAMPLE_RENAME_RULES = `lib/todo => lib/rename
components/todo => components/rename
`

/** Paths from ripgrep, glob lab, or stack traces to rewrite. */
export const SAMPLE_RENAME_PATHS = `lib/todo/parse.ts:102:export function parseTodoScan
components/todo/todo-app.tsx
app/todo/page.tsx
lib/todo/parse.test.ts:14:  const result = parseTodoScan
`
