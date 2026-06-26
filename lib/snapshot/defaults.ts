/** Sample Jest snapshot failure output for the demo textarea. */
export const SAMPLE_SNAPSHOT_JEST = ` FAIL  components/ui/button.test.tsx
  ● Button › renders primary variant

    expect(received).toMatchSnapshot()

    Snapshot name: \`Button renders primary variant 1\`

    - Snapshot  - 5
    + Received  + 7

    @@ -1,10 +1,12 @@
      <button
    -   className="btn"
    +   className="btn primary"
      >
        Click me
      </button>

 FAIL  lib/finance/compute.test.ts
  ● computeBudget › rolls negative balance

    expect(received).toMatchSnapshot()

    Snapshot name: \`computeBudget rolls negative balance 1\`

    - Snapshot  - 2
    + Received  + 4

Snapshot Summary
 › 2 snapshots failed from 2 test suites. Inspect your code changes or run \`pnpm test -- -u\` to update them.
 › 1 snapshot file obsolete from 1 test suite. To remove it, run \`pnpm test -- -u\`.
   ↳ components/crm/__snapshots__/crm-app.test.tsx.snap
`

/** Sample Vitest snapshot failure output. */
export const SAMPLE_SNAPSHOT_VITEST = ` FAIL  src/hooks/use-counter.test.ts > useCounter > increments from zero
Error: Snapshot \`useCounter increments from zero 1\` mismatched

- Expected
+ Received

  {
-   "count": 0,
+   "count": 1,
  }

 ❯ src/hooks/use-counter.test.ts:18:5

 Test Files  1 failed (1)
      Tests  1 failed | 3 passed (4)

  Snapshots  1 failed
`
