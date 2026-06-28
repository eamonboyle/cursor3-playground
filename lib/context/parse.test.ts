import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_CONTEXT_INPUT } from "./defaults.ts"
import {
  estimateTokens,
  formatContextLargestLabels,
  formatContextMarkdown,
  parseContextSize,
  splitContextSections,
} from "./parse.ts"

describe("estimateTokens", () => {
  it("returns zero for empty text", () => {
    assert.equal(estimateTokens(""), 0)
    assert.equal(estimateTokens("   "), 0)
  })

  it("uses a ~4 chars per token heuristic", () => {
    assert.equal(estimateTokens("abcd"), 1)
    assert.equal(estimateTokens("abcdefgh"), 2)
  })
})

describe("splitContextSections", () => {
  it("splits citation fences and path headers from sample input", () => {
    const sections = splitContextSections(SAMPLE_CONTEXT_INPUT)
    const kinds = sections.map((s) => s.kind)
    assert.ok(kinds.includes("path-header"))
    assert.ok(kinds.includes("citation"))
    assert.ok(kinds.includes("chunk"))

    const citation = sections.find((s) => s.kind === "citation")
    assert.ok(citation)
    assert.equal(citation.label, "lib/habits/streak.ts")
    assert.match(citation.text, /computeStreak/)
  })

  it("falls back to paragraph chunks without structure", () => {
    const text = "First paragraph.\n\nSecond paragraph."
    const sections = splitContextSections(text)
    assert.equal(sections.length, 2)
    assert.equal(sections[0]?.kind, "chunk")
    assert.match(sections[0]?.label ?? "", /Section 1/)
  })

  it("returns a single chunk for unstructured prose", () => {
    const sections = splitContextSections("Just one block of text without breaks.")
    assert.equal(sections.length, 1)
    assert.equal(sections[0]?.kind, "chunk")
  })
})

describe("parseContextSize", () => {
  it("summarizes tokens and budgets for sample input", () => {
    const result = parseContextSize(SAMPLE_CONTEXT_INPUT)
    assert.ok(result.summary.sectionCount >= 3)
    assert.ok(result.summary.totalTokens > 0)
    assert.equal(result.budgets.length, 3)
    assert.equal(result.budgets[0]?.limit, 8_000)
    assert.equal(result.budgets[2]?.limit, 128_000)
    assert.ok(result.budgets.every((b) => !b.exceeded))
  })

  it("warns on empty input", () => {
    const result = parseContextSize("  \n")
    assert.equal(result.sections.length, 0)
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("formats markdown and largest labels", () => {
    const result = parseContextSize(SAMPLE_CONTEXT_INPUT)
    const md = formatContextMarkdown(result)
    assert.match(md, /tokens across/)
    assert.match(md, /lib\/habits\/streak\.ts/)

    const labels = formatContextLargestLabels(result, 2)
    const lines = labels.split("\n").filter(Boolean)
    assert.equal(lines.length, 2)
    assert.match(lines[0] ?? "", /tokens/)
  })
})
