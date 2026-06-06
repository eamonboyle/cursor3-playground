/** Sample `pnpm test` / Node test runner TAP output for the demo textarea. */
export const SAMPLE_TEST_OUTPUT = `TAP version 13
# Subtest: parseEnvDiff
    # Subtest: warns on empty input
    not ok 1 - warns on empty input
      ---
      duration_ms: 0.412
      location: '/workspace/lib/env/diff.test.ts:18:3'
      failureType: 'testCodeFailure'
      error: 'expected warnings array to be non-empty'
      code: 'ERR_ASSERTION'
      name: 'AssertionError'
      stack: |-
        TestContext.<anonymous> (/workspace/lib/env/diff.test.ts:20:12)
        Test.runInAsyncScope (node:async_hooks:211:14)
      ...
    1..1
not ok 1 - parseEnvDiff
  ---
  duration_ms: 1.2
  type: 'suite'
  location: '/workspace/lib/env/diff.test.ts:12:1'
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
  ...
# Subtest: parseTscOutput
    # Subtest: parses classic format
    ok 1 - parses classic format
    # Subtest: strips ANSI color codes
    not ok 2 - strips ANSI color codes
      ---
      location: '/workspace/lib/tsc/parse.test.ts:55:3'
      error: '1 !== 2'
      stack: |-
        TestContext.<anonymous> (/workspace/lib/tsc/parse.test.ts:57:12)
      ...
    1..2
not ok 2 - parseTscOutput
  ---
  error: '1 subtest failed'
  ...
1..2
# tests 3
# suites 2
# pass 1
# fail 2
# skipped 0
# duration_ms 84.2

 FAIL  lib/stack/parse.test.ts > parseStackTrace > filters node_modules
AssertionError: expected 3 to be 2
 ❯ lib/stack/parse.test.ts:31:10

 FAIL  components/crm/crm-app.test.tsx > CrmApp > renders contact list
Error: Invalid hook call
 ❯ components/crm/crm-app.test.tsx:14:5

 FAIL  lib/json/parse.test.ts
  ● formatJson › minifies without trailing newline

    expect(received).toBe(expected)

    Expected: "{\\"a\\":1}"
    Received: "{\\"a\\":1}\\n"

      22 |     const out = formatJson('{ "a": 1 }', { mode: "minify" })
    > 23 |     expect(out).toBe('{"a":1}')
         |                 ^
      24 |   })

      at Object.<anonymous> (lib/json/parse.test.ts:23:21)
`
