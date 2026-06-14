import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_GREP_CONTEXT, SAMPLE_GREP_OUTPUT } from "./defaults.ts"
import {
  formatGrepFiles,
  formatGrepMarkdown,
  formatGrepPaths,
  hitLocation,
  parseGrepOutput,
} from "./parse.ts"

describe("parseGrepOutput", () => {
  it("parses inline path:line hits from sample output", () => {
    const result = parseGrepOutput(SAMPLE_GREP_OUTPUT, {
      hideNodeModules: true,
    })
    assert.equal(result.summary.matchCount, 7)
    assert.equal(result.summary.fileCount, 5)
    assert.ok(result.hits.every((h) => h.kind === "match"))
    assert.ok(result.hits.some((h) => h.path === "lib/finance/compute.ts"))
    assert.equal(result.hits.find((h) => h.line === 41)?.text, "// balance rollover logic")
  })

  it("filters node_modules when enabled", () => {
    const result = parseGrepOutput(SAMPLE_GREP_OUTPUT, {
      hideNodeModules: true,
    })
    assert.ok(!result.hits.some((h) => h.path.includes("node_modules")))
    assert.equal(result.hits.length, 7)
  })

  it("includes node_modules when filter is off", () => {
    const result = parseGrepOutput(SAMPLE_GREP_OUTPUT, {
      hideNodeModules: false,
    })
    assert.equal(result.hits.length, 8)
    assert.ok(result.hits.some((h) => h.path.includes("node_modules")))
  })

  it("filters by extension", () => {
    const result = parseGrepOutput(SAMPLE_GREP_OUTPUT, {
      hideNodeModules: true,
      extensionFilter: ".tsx",
    })
    assert.ok(result.hits.every((h) => h.path.endsWith(".tsx")))
    assert.equal(result.hits.length, 2)
  })

  it("parses ripgrep context blocks", () => {
    const result = parseGrepOutput(SAMPLE_GREP_CONTEXT, {
      matchesOnly: false,
    })
    assert.equal(result.summary.matchCount, 2)
    assert.equal(result.summary.contextCount, 4)
    assert.equal(result.groups.length, 2)
    const parseHit = result.hits.find(
      (h) => h.path === "lib/grep/parse.ts" && h.line === 42,
    )
    assert.ok(parseHit)
    assert.equal(parseHit.kind, "match")
    assert.ok(parseHit.text.includes("node_modules"))
  })

  it("hides context lines when matchesOnly is true", () => {
    const result = parseGrepOutput(SAMPLE_GREP_CONTEXT, {
      matchesOnly: true,
    })
    assert.equal(result.summary.contextCount, 0)
    assert.equal(result.summary.matchCount, 2)
  })

  it("formats paths and files", () => {
    const result = parseGrepOutput(SAMPLE_GREP_OUTPUT, {
      hideNodeModules: true,
    })
    const paths = formatGrepPaths(result)
    assert.ok(paths.includes("lib/finance/compute.ts:12"))
    const files = formatGrepFiles(result)
    assert.ok(files.includes("lib/env/diff.ts"))
    assert.equal(files.split("\n").length, 5)
  })

  it("hitLocation includes optional column", () => {
    const result = parseGrepOutput("lib/a.ts:10:5:const x = 1\n")
    assert.equal(hitLocation(result.hits[0]!), "lib/a.ts:10:5")
  })

  it("formatGrepMarkdown includes file groups", () => {
    const result = parseGrepOutput("lib/a.ts:1:foo\n")
    const md = formatGrepMarkdown(result)
    assert.ok(md.includes("lib/a.ts"))
    assert.ok(md.includes("match(es)"))
  })
})
