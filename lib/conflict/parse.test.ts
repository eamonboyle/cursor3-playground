import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_CONFLICT_FILEPATH, SAMPLE_CONFLICT_TEXT } from "./defaults.ts"
import {
  conflictLocation,
  formatConflictCitations,
  formatConflictLineRanges,
  formatConflictMarkdown,
  parseConflictMarkers,
} from "./parse.ts"

describe("parseConflictMarkers", () => {
  it("parses conflict blocks in the sample snippet", () => {
    const result = parseConflictMarkers(SAMPLE_CONFLICT_TEXT)
    assert.equal(result.summary.conflictCount, 2)
    assert.equal(result.blocks[0]?.oursLabel, "HEAD")
    assert.equal(result.blocks[0]?.theirsLabel, "feature/async-config")
    assert.ok((result.blocks[0]?.oursLineCount ?? 0) >= 2)
    assert.ok((result.blocks[1]?.theirsLineCount ?? 0) >= 2)
  })

  it("extracts ours and theirs content", () => {
    const text = `before
<<<<<<< HEAD
ours line
=======
theirs line
>>>>>>> branch
after`
    const result = parseConflictMarkers(text)
    assert.equal(result.blocks.length, 1)
    assert.match(result.blocks[0]?.oursContent ?? "", /ours line/)
    assert.match(result.blocks[0]?.theirsContent ?? "", /theirs line/)
    assert.equal(result.blocks[0]?.startLine, 2)
    assert.equal(result.blocks[0]?.separatorLine, 4)
    assert.equal(result.blocks[0]?.endLine, 6)
  })

  it("flags incomplete blocks", () => {
    const result = parseConflictMarkers("<<<<<<< HEAD\nstill open\n")
    assert.equal(result.blocks.length, 0)
    assert.ok(result.issues.some((i) => i.kind === "incomplete-block"))
  })

  it("flags orphan separators and ends", () => {
    const result = parseConflictMarkers("=======\n>>>>>>> orphan\n")
    assert.equal(result.blocks.length, 0)
    assert.ok(result.issues.some((i) => i.kind === "orphan-separator"))
    assert.ok(result.issues.some((i) => i.kind === "orphan-end"))
  })

  it("warns on empty input", () => {
    const result = parseConflictMarkers("  \n")
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("formats markdown, citations, and line ranges", () => {
    const result = parseConflictMarkers(SAMPLE_CONFLICT_TEXT)
    const md = formatConflictMarkdown(result, SAMPLE_CONFLICT_FILEPATH)
    assert.match(md, /conflict block/)
    assert.match(md, /HEAD/)

    const citations = formatConflictCitations(
      result,
      SAMPLE_CONFLICT_FILEPATH,
    )
    assert.match(citations, /lib\/config\/load\.ts/)

    const ranges = formatConflictLineRanges(result)
    assert.match(ranges, /\d+-\d+/)
  })

  it("builds citation locations with optional filepath", () => {
    const result = parseConflictMarkers(SAMPLE_CONFLICT_TEXT)
    const block = result.blocks[0]
    assert.ok(block)
    assert.equal(
      conflictLocation(block, SAMPLE_CONFLICT_FILEPATH),
      `${block.startLine}:${block.endLine}:${SAMPLE_CONFLICT_FILEPATH}`,
    )
    assert.match(conflictLocation(block), /lines/)
  })
})
