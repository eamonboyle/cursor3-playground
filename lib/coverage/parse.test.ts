import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_COVERAGE_SCAN } from "./defaults.ts"
import {
  formatCoverageMarkdown,
  formatCoveragePaths,
  formatCoverageUncovered,
  parseCoverageScan,
} from "./parse.ts"

describe("parseCoverageScan", () => {
  it("parses sample Istanbul table and sorts by lowest lines %", () => {
    const result = parseCoverageScan(SAMPLE_COVERAGE_SCAN)
    assert.equal(result.files.length, 5)
    assert.equal(result.files[0]?.path, "lib/utils.ts")
    assert.equal(result.files[0]?.lines, 0)
    assert.equal(result.files[1]?.path, "components/crm/crm-app.tsx")
    assert.match(result.files[1]?.uncoveredLines ?? "", /89-120/)
    assert.equal(result.files.at(-1)?.path, "lib/todo/parse.ts")
    assert.equal(result.files.at(-1)?.lines, 100)
  })

  it("hides node_modules by default", () => {
    const result = parseCoverageScan(SAMPLE_COVERAGE_SCAN)
    assert.ok(
      result.files.every((f) => !f.path.includes("node_modules")),
    )
  })

  it("filters by max lines percentage", () => {
    const result = parseCoverageScan(SAMPLE_COVERAGE_SCAN, {
      maxLinesPct: 70,
    })
    assert.ok(result.files.every((f) => (f.lines ?? 0) <= 70))
    assert.equal(result.files.length, 2)
  })

  it("parses compact percent lines", () => {
    const result = parseCoverageScan(
      "lib/a.ts: 42.5% lines\nlib/b.ts 100%\n",
    )
    assert.equal(result.files.length, 2)
    assert.equal(result.files[0]?.lines, 42.5)
    assert.equal(result.files[1]?.lines, 100)
  })

  it("warns on empty input", () => {
    const result = parseCoverageScan("  \n")
    assert.equal(result.files.length, 0)
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("formats markdown, paths, and uncovered lines", () => {
    const result = parseCoverageScan(SAMPLE_COVERAGE_SCAN)
    const md = formatCoverageMarkdown(result)
    assert.match(md, /5\*\* file/)
    assert.match(md, /lib\/utils\.ts/)

    const paths = formatCoveragePaths(result)
    assert.match(paths, /lib\/utils\.ts/)
    assert.equal(paths.split("\n").filter(Boolean).length, 5)

    const uncovered = formatCoverageUncovered(result)
    assert.match(uncovered, /lib\/glob\/filter\.ts: 12,28-35,88/)
  })

  it("filters by extension", () => {
    const result = parseCoverageScan(SAMPLE_COVERAGE_SCAN, {
      extensionFilter: "tsx",
    })
    assert.ok(result.files.every((f) => f.path.endsWith(".tsx")))
    assert.equal(result.files.length, 1)
  })
})
