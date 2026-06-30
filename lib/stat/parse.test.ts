import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_DIFF_NUMSTAT, SAMPLE_DIFF_STAT } from "./defaults.ts"
import {
  fileChurn,
  formatStatMarkdown,
  formatStatPaths,
  formatStatPrScope,
  parseDiffStatOutput,
  sortByChurn,
} from "./parse.ts"

describe("parseDiffStatOutput", () => {
  it("parses git diff --stat sample with binary and summary line", () => {
    const result = parseDiffStatOutput(SAMPLE_DIFF_STAT)
    assert.equal(result.format, "stat")
    assert.ok(result.files.length >= 8)
    assert.equal(result.summary.reportedFileCount, 9)
    assert.equal(result.summary.reportedAdditions, 451)
    assert.equal(result.summary.reportedDeletions, 2)

    const binary = result.files.find((f) => f.path === "public/logo.png")
    assert.ok(binary?.binary)

    const parseFile = result.files.find((f) => f.path === "lib/stat/parse.ts")
    assert.ok(parseFile)
    assert.ok(parseFile.additions > 0)
    assert.equal(parseFile.exact, false)
  })

  it("parses git diff --numstat with exact counts", () => {
    const result = parseDiffStatOutput(SAMPLE_DIFF_NUMSTAT)
    assert.equal(result.format, "numstat")
    assert.equal(result.files.length, 10)
    assert.equal(result.summary.additions, 461)
    assert.equal(result.summary.deletions, 0)
    assert.equal(result.summary.binaryCount, 1)

    const parseFile = result.files.find((f) => f.path === "lib/stat/parse.ts")
    assert.ok(parseFile)
    assert.equal(parseFile.additions, 142)
    assert.equal(parseFile.deletions, 0)
    assert.equal(parseFile.exact, true)
  })

  it("hides node_modules when requested", () => {
    const withModules = `3\t1\tlib/a.ts
0\t2\tnode_modules/pkg/index.js
`
    const filtered = parseDiffStatOutput(withModules, { hideNodeModules: true })
    assert.equal(filtered.files.length, 1)
    assert.equal(filtered.files[0]?.path, "lib/a.ts")
    assert.ok(filtered.warnings.some((w) => /node_modules/i.test(w)))
  })

  it("warns on empty input", () => {
    const result = parseDiffStatOutput("  \n")
    assert.equal(result.files.length, 0)
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("sorts by churn and formats outputs", () => {
    const result = parseDiffStatOutput(SAMPLE_DIFF_NUMSTAT)
    const sorted = sortByChurn(result.files)
    assert.equal(sorted[0]?.path, "components/stat/stat-app.tsx")
    assert.equal(fileChurn(sorted[0]!), 210)

    const md = formatStatMarkdown(result)
    assert.match(md, /file\(s\)/)
    assert.match(md, /lib\/stat\/parse\.ts/)

    const paths = formatStatPaths(result)
    assert.ok(paths.includes("lib/stat/parse.ts"))

    const pr = formatStatPrScope(result)
    assert.match(pr, /## Diff size/)
    assert.match(pr, /Largest changes/)
  })
})
