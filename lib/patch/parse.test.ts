import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { formatPatchSummaryMarkdown, parseUnifiedDiff } from "./parse.ts"
import { SAMPLE_UNIFIED_DIFF } from "./defaults.ts"

describe("parseUnifiedDiff", () => {
  it("parses sample diff with new file, edits, and binary", () => {
    const result = parseUnifiedDiff(SAMPLE_UNIFIED_DIFF)
    assert.equal(result.files.length, 3)
    assert.equal(result.summary.additions, 8)
    assert.equal(result.summary.deletions, 0)
    assert.equal(result.summary.binaryCount, 1)

    const parseFile = result.files.find((f) => f.path.endsWith("parse.ts"))
    assert.ok(parseFile)
    assert.equal(parseFile.isNew, true)
    assert.equal(parseFile.additions, 7)

    const readme = result.files.find((f) => f.path === "README.md")
    assert.ok(readme)
    assert.equal(readme.additions, 1)
    assert.equal(readme.deletions, 0)

    const binary = result.files.find((f) => f.path.endsWith("logo.png"))
    assert.ok(binary?.binary)
  })

  it("warns on empty input", () => {
    const result = parseUnifiedDiff("  \n")
    assert.equal(result.files.length, 0)
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("formats markdown summary", () => {
    const result = parseUnifiedDiff(SAMPLE_UNIFIED_DIFF)
    const md = formatPatchSummaryMarkdown(result)
    assert.match(md, /3\*\* file/)
    assert.match(md, /README\.md/)
  })
})
