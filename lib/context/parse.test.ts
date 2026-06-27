import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_CONTEXT_INPUT } from "./defaults.ts"
import {
  estimateTokens,
  formatContextMarkdown,
  formatLargestSectionLabels,
  parseContextInput,
} from "./parse.ts"

describe("estimateTokens", () => {
  it("estimates from character count by default", () => {
    assert.equal(estimateTokens(400, 50, "chars"), 100)
  })

  it("estimates from word count when method is words", () => {
    assert.equal(estimateTokens(400, 75, "words"), 100)
  })
})

describe("parseContextInput", () => {
  it("splits sample input into multiple sections", () => {
    const result = parseContextInput(SAMPLE_CONTEXT_INPUT)
    assert.ok(result.sections.length >= 3)
    assert.ok(result.summary.tokens > 0)
    assert.ok(
      result.sections.some((s) => s.label === "lib/finance/compute.ts"),
    )
    assert.ok(
      result.sections.some((s) =>
        s.label.includes("components/finance/finance-app.tsx"),
      ),
    )
  })

  it("treats plain text as a single section", () => {
    const result = parseContextInput("hello world\nsecond line")
    assert.equal(result.sections.length, 1)
    assert.equal(result.sections[0]?.label, "(entire paste)")
    assert.equal(result.sections[0]?.lines, 2)
    assert.ok(result.warnings.some((w) => w.includes("Single block")))
  })

  it("parses --- path --- delimiters", () => {
    const text = `--- lib/a.ts ---
line one
--- lib/b.ts ---
line two`
    const result = parseContextInput(text)
    assert.equal(result.sections.length, 2)
    assert.ok(result.sections.some((s) => s.label === "lib/a.ts"))
    assert.ok(result.sections.some((s) => s.label === "lib/b.ts"))
  })

  it("sorts sections by token size descending", () => {
    const result = parseContextInput(SAMPLE_CONTEXT_INPUT)
    for (let i = 1; i < result.sections.length; i++) {
      assert.ok(
        result.sections[i - 1]!.tokens >= result.sections[i]!.tokens,
      )
    }
  })

  it("computes budget rows", () => {
    const result = parseContextInput("x".repeat(40_000))
    assert.equal(result.budgets.length, 3)
    assert.ok(result.budgets.some((b) => b.status === "over"))
  })

  it("formats markdown and largest labels", () => {
    const result = parseContextInput(SAMPLE_CONTEXT_INPUT)
    const md = formatContextMarkdown(result)
    assert.ok(md.includes("estimated tokens"))
    const labels = formatLargestSectionLabels(result)
    assert.ok(labels.includes("lib/finance/compute.ts"))
  })
})
