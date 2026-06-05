/** Sample `pnpm lint` / `eslint` stylish output for the demo textarea. */
export const SAMPLE_ESLINT_OUTPUT = `components/crm/crm-app.tsx
  14:7  warning  'draft' is assigned a value but never used  @typescript-eslint/no-unused-vars
  88:3  error  Expected an assignment or function call and instead saw an expression  @typescript-eslint/no-unused-expressions

lib/env/diff.ts
  19:14  error  'maskSecret' is not defined  no-undef

node_modules/foo/index.js
  1:1  error  Parsing error: Unexpected token  null

./app/page.tsx
  42:11  warning  Unexpected console statement  no-console

✖ 5 problems (3 errors, 2 warnings)
`
