import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_TEST_OUTPUT } from "./defaults.ts"
import {
  failureLocation,
  formatTestMarkdown,
  formatTestPaths,
  parseTestOutput,
} from "./parse.ts"

describe("parseTestOutput", () => {
  it("parses Node TAP, Vitest, and Jest failures from sample output", () => {
    const result = parseTestOutput(SAMPLE_TEST_OUTPUT, {
      hideNodeModules: true,
    })
    assert.ok(result.failures.length >= 5)
    assert.ok(result.summary.byFile["/workspace/lib/env/diff.test.ts"] >= 1)
    assert.ok(result.summary.byFile["lib/stack/parse.test.ts"] >= 1)
    assert.ok(result.summary.byFile["lib/json/parse.test.ts"] >= 1)

    const nodeFail = result.failures.find((f) =>
      f.name.includes("warns on empty input"),
    )
    assert.ok(nodeFail)
    assert.equal(nodeFail.format, "node-tap")
    assert.equal(nodeFail.line, 18)
    assert.equal(nodeFail.column, 3)

    const vitestFail = result.failures.find((f) =>
      f.name.includes("filters node_modules"),
    )
    assert.ok(vitestFail)
    assert.equal(vitestFail.format, "vitest")
    assert.equal(vitestFail.line, 31)

    const jestFail = result.failures.find((f) =>
      f.name.includes("minifies without trailing newline"),
    )
    assert.ok(jestFail)
    assert.equal(jestFail.format, "jest")
    assert.equal(jestFail.line, 23)
  })

  it("reads Node TAP summary counts", () => {
    const result = parseTestOutput(SAMPLE_TEST_OUTPUT)
    assert.equal(result.summary.total, 3)
    assert.equal(result.summary.passed, 1)
    assert.equal(result.summary.failed, result.failures.length)
  })

  it("parses a minimal Vitest failure block", () => {
    const result = parseTestOutput(
      " FAIL  src/a.test.ts > suite > does work\nAssertionError: boom\n ❯ src/a.test.ts:10:5\n",
    )
    assert.equal(result.failures.length, 1)
    assert.equal(result.failures[0]?.path, "src/a.test.ts")
    assert.equal(result.failures[0]?.line, 10)
    assert.equal(result.failures[0]?.name, "does work")
  })

  it("parses stack frames when location is missing", () => {
    const result = parseTestOutput(
      "not ok 1 - breaks\n  ---\n  stack: |-\n    TestContext.<anonymous> (lib/x.test.ts:7:3)\n  ...\n",
    )
    assert.equal(result.failures.length, 1)
    assert.equal(result.failures[0]?.path, "lib/x.test.ts")
    assert.equal(result.failures[0]?.line, 7)
  })

  it("strips ANSI codes before parsing", () => {
    const result = parseTestOutput(
      "\x1b[31m FAIL \x1b[0m\x1b[1msrc/a.test.ts\x1b[0m > \x1b[1msuite\x1b[0m > \x1b[1mtest\x1b[0m\n",
    )
    assert.equal(result.failures.length, 1)
    assert.equal(result.failures[0]?.path, "src/a.test.ts")
  })

  it("warns on empty input", () => {
    const result = parseTestOutput("  \n")
    assert.equal(result.failures.length, 0)
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("formats markdown and unique paths", () => {
    const result = parseTestOutput(SAMPLE_TEST_OUTPUT)
    const md = formatTestMarkdown(result)
    assert.match(md, /failure\(s\)/)
    assert.match(md, /diff\.test\.ts/)

    const paths = formatTestPaths(result)
    assert.match(paths, /diff\.test\.ts:18/)
    assert.match(paths, /parse\.test\.ts:31/)
  })

  it("failureLocation includes column when present", () => {
    const result = parseTestOutput(
      " FAIL  lib/x.test.ts > s > t\n ❯ lib/x.test.ts:2:9\n",
    )
    const loc = failureLocation(result.failures[0]!)
    assert.equal(loc, "lib/x.test.ts:2:9")
  })
})
