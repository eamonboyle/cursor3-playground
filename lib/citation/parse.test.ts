import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_CITATION_SCAN } from "./defaults.ts"
import {
  buildCitation,
  formatCitationScanBlocks,
  parseCitationScan,
} from "./parse.ts"

describe("buildCitation", () => {
  it("formats a fence with line range and path", () => {
    const block = buildCitation({
      filepath: "lib/foo.ts",
      startLine: 10,
      endLine: 15,
      code: "const x = 1",
    })
    assert.match(block, /^```10:15:lib\/foo\.ts\n/)
    assert.match(block, /const x = 1\n```$/)
  })

  it("uses start line as end when building single-line citation", () => {
    const block = buildCitation({
      filepath: "app/page.tsx",
      startLine: 3,
      endLine: 3,
    })
    assert.match(block, /^```3:3:app\/page\.tsx\n```$/)
  })
})

describe("parseCitationScan", () => {
  it("parses ripgrep path:line rows", () => {
    const result = parseCitationScan(SAMPLE_CITATION_SCAN)
    assert.equal(result.citations.length, 3)
    assert.equal(result.citations[0]?.filepath, "lib/patch/parse.ts")
    assert.equal(result.citations[0]?.startLine, 76)
    assert.match(result.citations[0]?.code ?? "", /parseUnifiedDiff/)
  })

  it("parses existing citation fences", () => {
    const text = buildCitation({
      filepath: "lib/bar.ts",
      startLine: 1,
      endLine: 2,
      code: "export {}",
    })
    const result = parseCitationScan(text)
    assert.equal(result.citations.length, 1)
    assert.equal(result.citations[0]?.filepath, "lib/bar.ts")
    assert.equal(result.citations[0]?.endLine, 2)
  })

  it("warns on empty input", () => {
    const result = parseCitationScan("  \n")
    assert.equal(result.citations.length, 0)
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("formats copyable citation blocks", () => {
    const result = parseCitationScan(SAMPLE_CITATION_SCAN)
    const blocks = formatCitationScanBlocks(result)
    assert.match(blocks, /```76:76:lib\/patch\/parse\.ts/)
    assert.match(blocks, /```50:50:components\/patch\/patch-app\.tsx/)
  })
})
