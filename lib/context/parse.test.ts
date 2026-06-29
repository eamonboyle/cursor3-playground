import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_CONTEXT_TEXT } from "./defaults.ts"
import {
  estimateTokens,
  formatContextMarkdown,
  formatContextSectionTitles,
  parseContextInput,
  sectionsWithinBudget,
} from "./parse.ts"

describe("estimateTokens", () => {
  it("returns zero for empty text", () => {
    assert.equal(estimateTokens(""), 0)
  })

  it("uses a four-characters-per-token heuristic", () => {
    assert.equal(estimateTokens("abcd"), 1)
    assert.equal(estimateTokens("abcdefgh"), 2)
    assert.equal(estimateTokens("abcdefghi"), 3)
  })
})

describe("parseContextInput", () => {
  it("splits the sample into citations and plain sections", () => {
    const result = parseContextInput(SAMPLE_CONTEXT_TEXT)
    assert.ok(result.sections.length >= 3)
    assert.ok(result.sections.some((section) => section.kind === "citation"))
    assert.ok(result.sections.some((section) => section.kind === "plain"))
    assert.ok(result.totalTokens > 0)
    assert.equal(
      result.ranked[0]?.tokens,
      Math.max(...result.sections.map((s) => s.tokens)),
    )
  })

  it("treats plain text as a single section", () => {
    const result = parseContextInput("Just a short note for the agent.")
    assert.equal(result.sections.length, 1)
    assert.equal(result.sections[0]?.kind, "plain")
    assert.ok(result.warnings.some((warning) => /single block/i.test(warning)))
  })

  it("splits on path headers when no citations are present", () => {
    const result = parseContextInput(
      "--- lib/a.ts ---\nconst a = 1\n\n--- lib/b.ts ---\nconst b = 2\n",
    )
    assert.equal(result.sections.length, 2)
    assert.equal(result.sections[0]?.title, "lib/a.ts")
    assert.equal(result.sections[1]?.title, "lib/b.ts")
  })

  it("flags budget overflow for very large pastes", () => {
    const huge = "x".repeat(40_000)
    const result = parseContextInput(huge)
    const eightK = result.budgets.find((status) => status.budget.id === "8k")
    assert.ok(eightK)
    assert.equal(eightK.fits, false)
    assert.ok(eightK.overBy > 0)
    assert.ok(result.warnings.some((warning) => /8k budget/i.test(warning)))
  })

  it("warns on empty input", () => {
    const result = parseContextInput("   \n")
    assert.equal(result.sections.length, 0)
    assert.ok(result.warnings.some((warning) => /paste agent context/i.test(warning)))
  })

  it("formats markdown and section title lists", () => {
    const result = parseContextInput(SAMPLE_CONTEXT_TEXT)
    const md = formatContextMarkdown(result)
    assert.match(md, /estimated token/)
    assert.match(md, /Sections/)

    const titles = formatContextSectionTitles(result)
    assert.ok(titles.split("\n").length >= 2)
  })
})

describe("sectionsWithinBudget", () => {
  it("selects largest sections that fit the limit", () => {
    const sections = [
      { id: "a", kind: "plain" as const, title: "a", content: "aaaa", chars: 4, lines: 1, tokens: 100 },
      { id: "b", kind: "plain" as const, title: "b", content: "bbbb", chars: 4, lines: 1, tokens: 50 },
      { id: "c", kind: "plain" as const, title: "c", content: "cccc", chars: 4, lines: 1, tokens: 40 },
    ]
    const ranked = [...sections].sort((a, b) => b.tokens - a.tokens)
    const pick = sectionsWithinBudget(ranked, 120)
    assert.deepEqual(
      pick.included.map((section) => section.title),
      ["a"],
    )
    assert.equal(pick.tokens, 100)
    assert.equal(pick.remaining, 20)
  })
})
