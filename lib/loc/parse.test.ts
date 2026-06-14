import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_LOC_SCAN } from "./defaults.ts"
import {
  formatLocLargestPaths,
  formatLocMarkdown,
  formatLocPaths,
  parseLocScan,
} from "./parse.ts"

describe("parseLocScan", () => {
  it("parses wc -l output and skips total lines", () => {
    const result = parseLocScan(SAMPLE_LOC_SCAN)
    assert.equal(result.summary.fileCount, 9)
    assert.ok(!result.entries.some((e) => e.path === "total"))
    assert.equal(
      result.summary.totalLines,
      271 + 129 + 61 + 22 + 9 + 337 + 59 + 104 + 48,
    )
  })

  it("hides node_modules by default", () => {
    const result = parseLocScan(SAMPLE_LOC_SCAN)
    assert.ok(!result.entries.some((e) => e.path.includes("node_modules")))
  })

  it("includes node_modules when hideNodeModules is false", () => {
    const result = parseLocScan(SAMPLE_LOC_SCAN, { hideNodeModules: false })
    assert.ok(result.entries.some((e) => e.path.includes("node_modules")))
  })

  it("parses tab-separated and ripgrep count formats", () => {
    const text = "lib/a.ts\t42\nlib/b.ts,10\nlib/c.ts:7\n"
    const result = parseLocScan(text)
    assert.equal(result.summary.fileCount, 3)
    assert.equal(result.summary.totalLines, 59)
  })

  it("dedupes paths and keeps the larger count", () => {
    const text = "  10 lib/foo.ts\n  99 lib/foo.ts\n"
    const result = parseLocScan(text)
    assert.equal(result.entries.length, 1)
    assert.equal(result.entries[0]?.lines, 99)
  })

  it("filters by extension", () => {
    const result = parseLocScan(SAMPLE_LOC_SCAN, { extensionFilter: ".ts" })
    assert.ok(result.entries.every((e) => e.path.endsWith(".ts")))
  })

  it("warns on empty input", () => {
    const result = parseLocScan("  \n")
    assert.equal(result.entries.length, 0)
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("formats markdown and paths", () => {
    const result = parseLocScan(SAMPLE_LOC_SCAN)
    const md = formatLocMarkdown(result)
    assert.match(md, /lines across/)
    assert.match(md, /\.tsx/)

    const paths = formatLocPaths(result)
    assert.match(paths, /changes-app\.tsx:271/)

    const largest = formatLocLargestPaths(result, 3)
    const largestLines = largest.split("\n").filter(Boolean)
    assert.equal(largestLines.length, 3)
    assert.equal(largestLines[0], "lib/playground/demos.ts")
  })

  it("sorts entries by line count descending", () => {
    const result = parseLocScan(SAMPLE_LOC_SCAN)
    for (let i = 1; i < result.entries.length; i++) {
      assert.ok(
        (result.entries[i - 1]?.lines ?? 0) >= (result.entries[i]?.lines ?? 0),
      )
    }
  })
})
