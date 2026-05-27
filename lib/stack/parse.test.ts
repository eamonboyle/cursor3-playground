import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_STACK_TRACE } from "./defaults.ts"
import {
  formatStackFramesMarkdown,
  formatStackFramesPaths,
  frameLocation,
  parseStackTrace,
} from "./parse.ts"

describe("parseStackTrace", () => {
  it("extracts V8, webpack-internal, and Python frames from sample", () => {
    const result = parseStackTrace(SAMPLE_STACK_TRACE, {
      hideNodeModules: true,
      hideInternals: true,
    })

    assert.ok(result.unique.length >= 2)
    assert.ok(
      result.unique.some((f) =>
        f.path.includes("components/recipes/recipes-app.tsx"),
      ),
    )
    assert.ok(
      result.unique.some((f) => f.path.endsWith("lib/recipes/scale.ts")),
    )
    assert.ok(result.skipped >= 2)
  })

  it("skips node_modules and node: internals when filters are on", () => {
    const trace = `Error: fail
    at foo (node_modules/react/index.js:1:1)
    at bar (node:internal/fs:1:1)
    at baz (src/app.ts:10:5)`
    const result = parseStackTrace(trace, {
      hideNodeModules: true,
      hideInternals: true,
    })

    assert.equal(result.frames.length, 1)
    assert.equal(result.frames[0]?.path, "src/app.ts")
    assert.equal(result.skipped, 2)
  })

  it("deduplicates repeated path:line entries", () => {
    const trace = `    at fn (lib/a.ts:1:1)
    at fn2 (lib/a.ts:1:9)
    at fn3 (lib/b.ts:2:1)`
    const result = parseStackTrace(trace)
    assert.equal(result.frames.length, 3)
    assert.equal(result.unique.length, 2)
  })

  it("parses Rust arrow frames", () => {
    const result = parseStackTrace(`   --> src/main.rs:42:5`)
    assert.equal(result.frames[0]?.kind, "rust")
    assert.equal(result.frames[0]?.line, 42)
    assert.equal(result.frames[0]?.column, 5)
  })

  it("warns when text has no recognizable frames", () => {
    const result = parseStackTrace("something went wrong\nno paths here")
    assert.equal(result.frames.length, 0)
    assert.ok(result.warnings.length > 0)
  })

  it("formats copy targets", () => {
    const result = parseStackTrace(`    at x (lib/x.ts:3:1)`)
    const frame = result.frames[0]
    assert.ok(frame)
    assert.equal(frameLocation(frame), "lib/x.ts:3:1")
    assert.equal(formatStackFramesPaths(result.unique), "lib/x.ts:3")
    const md = formatStackFramesMarkdown(result.unique)
    assert.match(md, /lib\/x\.ts:3/)
  })
})
