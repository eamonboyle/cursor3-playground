/** Sample `pnpm build` / Next.js compile output for the demo textarea. */
export const SAMPLE_BUILD_OUTPUT = `   ▲ Next.js 16.2.7 (Turbopack)

   Creating an optimized production build ...
Failed to compile.

./app/dashboard/page.tsx:25:8
Type error: Type 'string' is not assignable to type 'number'.

  23 |   const total = items.length
  24 |   return (
> 25 |     <div>{value}</div>
     |        ^
  26 |   )
  27 | }

./components/ui/button.tsx
Module not found: Can't resolve '@/lib/missing' in '/workspace/components/ui'

./lib/env/diff.ts:88:3
Type error: 'maskSecret' is possibly 'undefined'.

node_modules/foo/index.js
Error: Parsing error: Unexpected token

./app/api/links/preview/route.ts
Error: Route segment config "dynamic" is invalid.

> Build failed because of webpack errors
`
