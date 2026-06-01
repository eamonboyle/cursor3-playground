import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_WHITESPACE_TEXT } from "./defaults.ts"
import {
  formatWhitespaceIssueLines,
  formatWhitespaceScanMarkdown,
  parseWhitespaceScan,
} from "./parse.ts"

describe("parseWhitespaceScan", () => {
  it("detects issues in the sample snippet", () => {
    const result = parseWhitespaceScan(SAMPLE_WHITESPACE_TEXT)
    assert.ok(result.summary.trailingWhitespaceLines >= 1)
    assert.ok(result.summary.invisibleCharCount >= 2)
    assert.ok(
      result.issues.some((i) => i.kind === "invisible-char"),
    )
    assert.ok(
      result.issues.some((i) => i.kind === "trailing-whitespace"),
    )
  })

  it("reports LF-only line endings", () => {
    const result = parseWhitespaceScan("a\nb\n")
    assert.equal(result.summary.lineEnding, "lf")
    assert.equal(result.summary.lineEndingCounts.crlf, 0)
    assert.equal(result.summary.hasFinalNewline, true)
  })

  it("reports CRLF line endings", () => {
    const result = parseWhitespaceScan("a\r\nb\r\n")
    assert.equal(result.summary.lineEnding, "crlf")
    assert.equal(result.summary.lineEndingCounts.crlf, 2)
  })

  it("flags mixed line endings", () => {
    const result = parseWhitespaceScan("unix\nwin\r\ncr\r")
    assert.equal(result.summary.lineEnding, "none")
    assert.ok(
      result.issues.some((i) => i.kind === "mixed-line-endings"),
    )
  })

  it("flags mixed indent", () => {
    const result = parseWhitespaceScan("  spaces\n\ttabs\n")
    assert.equal(result.summary.indent, "mixed")
    assert.ok(result.issues.some((i) => i.kind === "mixed-indent"))
  })

  it("warns on empty input", () => {
    const result = parseWhitespaceScan("   \n")
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("flags missing final newline", () => {
    const result = parseWhitespaceScan("no newline at end")
    assert.ok(
      result.issues.some((i) => i.kind === "missing-final-newline"),
    )
    assert.equal(result.summary.hasFinalNewline, false)
  })

  it("formats markdown and issue line list", () => {
    const result = parseWhitespaceScan(SAMPLE_WHITESPACE_TEXT)
    const md = formatWhitespaceScanMarkdown(result)
    assert.match(md, /Whitespace scan/)
    assert.match(md, /Issues/)

    const lines = formatWhitespaceIssueLines(result)
    assert.match(lines, /\d+/)
  })
})
