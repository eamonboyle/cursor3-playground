import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_PLAYWRIGHT_OUTPUT } from "./defaults.ts"
import {
  failureLocation,
  formatPlaywrightMarkdown,
  formatPlaywrightPaths,
  parsePlaywrightOutput,
} from "./parse.ts"

describe("parsePlaywrightOutput", () => {
  it("parses inline, numbered, and summary failures from sample output", () => {
    const result = parsePlaywrightOutput(SAMPLE_PLAYWRIGHT_OUTPUT, {
      hideNodeModules: true,
    })

    assert.ok(result.failures.length >= 2)
    assert.ok(result.summary.byFile["tests/login.spec.ts"] >= 2)
    assert.ok(result.summary.byProject.chromium >= 1)
    assert.ok(result.summary.byProject.firefox >= 1)

    const chromiumBlock = result.failures.find(
      (f) => f.project === "chromium" && f.line === 45,
    )
    assert.ok(chromiumBlock)
    assert.equal(chromiumBlock.name, "submits the form")
    assert.equal(chromiumBlock.suite, "Login")

    const firefoxBlock = result.failures.find(
      (f) => f.project === "firefox" && f.path?.includes("login.spec.ts"),
    )
    assert.ok(firefoxBlock)
    assert.equal(firefoxBlock.line, 38)
  })

  it("reads passed and failed summary counts", () => {
    const result = parsePlaywrightOutput(SAMPLE_PLAYWRIGHT_OUTPUT)
    assert.equal(result.summary.passed, 2)
    assert.equal(result.summary.total, 4)
  })

  it("parses a minimal numbered failure with stack frame", () => {
    const result = parsePlaywrightOutput(
      "  1) tests/a.spec.ts:10:5 › suite › does work\n\n    Error: boom\n\n       at tests/a.spec.ts:15:3\n",
    )
    assert.equal(result.failures.length, 1)
    assert.equal(result.failures[0]?.path, "tests/a.spec.ts")
    assert.equal(result.failures[0]?.line, 15)
    assert.equal(result.failures[0]?.name, "does work")
    assert.equal(result.failures[0]?.message, "boom")
  })

  it("parses inline failure lines during the run", () => {
    const result = parsePlaywrightOutput(
      "  ✘  [webkit] › e2e/home.spec.ts:3:1 › Home › renders (1.2s)\n",
    )
    assert.equal(result.failures.length, 1)
    assert.equal(result.failures[0]?.project, "webkit")
    assert.equal(result.failures[0]?.path, "e2e/home.spec.ts")
    assert.equal(result.failures[0]?.line, 3)
  })

  it("strips ANSI codes before parsing", () => {
    const result = parsePlaywrightOutput(
      "\x1b[31m  ✘  \x1b[0m\x1b[1mtests/a.spec.ts:2:1\x1b[0m › \x1b[1msuite\x1b[0m › \x1b[1mtest\x1b[0m\n",
    )
    assert.equal(result.failures.length, 1)
    assert.equal(result.failures[0]?.path, "tests/a.spec.ts")
  })

  it("warns on empty input", () => {
    const result = parsePlaywrightOutput("  \n")
    assert.equal(result.failures.length, 0)
    assert.ok(result.warnings.some((w) => w.includes("Paste output")))
  })

  it("formats markdown and copyable paths", () => {
    const result = parsePlaywrightOutput(SAMPLE_PLAYWRIGHT_OUTPUT)
    const markdown = formatPlaywrightMarkdown(result)
    assert.match(markdown, /\*\*.*failure/)
    assert.match(markdown, /tests\/login\.spec\.ts/)

    const paths = formatPlaywrightPaths(result)
    assert.match(paths, /tests\/login\.spec\.ts:\d+/)
  })

  it("formats failure locations", () => {
    const loc = failureLocation({
      path: "tests/a.spec.ts",
      line: 4,
      column: 2,
      name: "x",
      sourceLine: 1,
      raw: "",
      origin: "numbered",
    })
    assert.equal(loc, "tests/a.spec.ts:4:2")
  })
})
