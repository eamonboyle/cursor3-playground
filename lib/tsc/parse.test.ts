import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_TSC_OUTPUT } from "./defaults.ts"
import {
  diagnosticLocation,
  formatTscMarkdown,
  formatTscPaths,
  parseTscOutput,
} from "./parse.ts"

describe("parseTscOutput", () => {
  it("parses classic and pretty formats from sample output", () => {
    const result = parseTscOutput(SAMPLE_TSC_OUTPUT, {
      hideNodeModules: true,
    })
    assert.equal(result.summary.errors, 4)
    assert.equal(result.diagnostics.length, 4)
    assert.ok(result.summary.byCode.TS2345 >= 1)
    assert.ok(result.summary.byCode.TS2322 >= 1)
    assert.equal(result.fileCount, 3)

    const finance = result.diagnostics.find((d) =>
      d.path?.includes("finance/compute"),
    )
    assert.ok(finance)
    assert.equal(finance.code, "TS2345")
    assert.equal(finance.line, 41)
    assert.equal(finance.column, 7)
  })

  it("includes node_modules when filter is off", () => {
    const result = parseTscOutput(SAMPLE_TSC_OUTPUT, {
      hideNodeModules: false,
    })
    assert.equal(result.diagnostics.length, 5)
    assert.ok(
      result.diagnostics.some((d) => d.path?.includes("node_modules")),
    )
  })

  it("parses global errors without a file location", () => {
    const result = parseTscOutput(
      "error TS6059: File 'x.ts' is not under 'rootDir'.\n",
    )
    assert.equal(result.diagnostics.length, 1)
    assert.equal(result.diagnostics[0]?.code, "TS6059")
    assert.equal(result.diagnostics[0]?.path, undefined)
  })

  it("strips ANSI color codes before parsing", () => {
    const result = parseTscOutput(
      "\x1b[96msrc/a.ts\x1b[0m:\x1b[93m10\x1b[0m:\x1b[93m5\x1b[0m - \x1b[91merror\x1b[0m \x1b[93mTS2322\x1b[0m: Message here.\n",
    )
    assert.equal(result.diagnostics.length, 1)
    assert.equal(result.diagnostics[0]?.path, "src/a.ts")
    assert.equal(result.diagnostics[0]?.line, 10)
  })

  it("warns on empty input", () => {
    const result = parseTscOutput("  \n")
    assert.equal(result.diagnostics.length, 0)
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("formats markdown and unique paths", () => {
    const result = parseTscOutput(SAMPLE_TSC_OUTPUT)
    const md = formatTscMarkdown(result)
    assert.match(md, /error\(s\)/)
    assert.match(md, /TS2345/)

    const paths = formatTscPaths(result)
    assert.match(paths, /finance\/compute\.ts:41/)
    assert.match(paths, /crm-app\.tsx:128/)
  })

  it("diagnosticLocation includes column when present", () => {
    const result = parseTscOutput(
      "lib/x.ts(2,9): error TS1005: ';' expected.\n",
    )
    const loc = diagnosticLocation(result.diagnostics[0]!)
    assert.equal(loc, "lib/x.ts:2:9")
  })
})
