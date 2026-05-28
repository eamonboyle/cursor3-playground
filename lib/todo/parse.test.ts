import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_TODO_SCAN } from "./defaults.ts"
import {
  formatTodoScanMarkdown,
  formatTodoScanPaths,
  markerLocation,
  parseTodoScan,
} from "./parse.ts"

describe("parseTodoScan", () => {
  it("parses sample ripgrep output with multiple tags", () => {
    const result = parseTodoScan(SAMPLE_TODO_SCAN)
    assert.equal(result.summary.total, 6)
    assert.equal(result.summary.byTag.TODO, 2)
    assert.equal(result.summary.byTag.FIXME, 1)
    assert.equal(result.summary.byTag.HACK, 1)
    assert.equal(result.summary.byTag.XXX, 1)
    assert.equal(result.summary.byTag.BUG, 1)

    const finance = result.markers.find((m) =>
      m.path?.includes("finance/compute"),
    )
    assert.ok(finance)
    assert.equal(finance.tag, "TODO")
    assert.equal(finance.line, 41)
    assert.match(finance.message, /rollover/i)
  })

  it("parses plain lines without path prefix", () => {
    const result = parseTodoScan("// FIXME: ship before Friday\n")
    assert.equal(result.markers.length, 1)
    assert.equal(result.markers[0]?.tag, "FIXME")
    assert.equal(result.markers[0]?.path, undefined)
  })

  it("warns on empty input", () => {
    const result = parseTodoScan("  \n")
    assert.equal(result.markers.length, 0)
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("formats markdown and unique paths", () => {
    const result = parseTodoScan(SAMPLE_TODO_SCAN)
    const md = formatTodoScanMarkdown(result)
    assert.match(md, /6\*\* marker/)
    assert.match(md, /FIXME/)

    const paths = formatTodoScanPaths(result)
    assert.match(paths, /finance\/compute\.ts:41/)
    const lineCount = paths.split("\n").filter(Boolean).length
    assert.equal(lineCount, 5)
  })

  it("markerLocation includes column when present", () => {
    const result = parseTodoScan("src/a.ts:10:3: // TODO: x\n")
    const loc = markerLocation(result.markers[0]!)
    assert.equal(loc, "src/a.ts:10:3")
  })
})
