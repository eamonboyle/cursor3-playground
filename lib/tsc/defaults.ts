/** Sample `pnpm typecheck` / `tsc --noEmit` output for the demo textarea. */
export const SAMPLE_TSC_OUTPUT = `lib/finance/compute.ts(41,7): error TS2345: Argument of type 'number | undefined' is not assignable to parameter of type 'number'.
  Type 'undefined' is not assignable to type 'number'.
components/crm/crm-app.tsx:128:9 - error TS2322: Type 'string' is not assignable to type 'ContactStatus'.
lib/env/diff.ts(19,14): error TS2339: Property 'maskSecret' does not exist on type 'EnvRow'.
node_modules/@types/node/index.d.ts(42,1): error TS6200: Definitions of the following identifiers conflict with those in another file.
error TS6059: File '/workspace/tmp/out.ts' is not under 'rootDir' '/workspace/lib'.
Found 4 errors in 3 files.
`
