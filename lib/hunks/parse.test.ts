import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_HUNKS_DIFF } from "./defaults.ts"
import {
  formatHunkCitation,
  formatHunkCitations,
  formatHunkPaths,
  formatHunksMarkdown,
  hunkCitationRange,
  parseDiffHunks,
} from "./parse.ts"

describe("parseDiffHunks", () => {
  it("parses multiple hunks from sample diff", () => {
    const result = parseDiffHunks(SAMPLE_HUNKS_DIFF)
    assert.equal(result.summary.hunkCount, 3)
    assert.equal(result.summary.fileCount, 2)
    assert.ok(result.summary.additions >= 20)
    assert.equal(result.summary.binaryCount, 0)

    const parseFile = result.hunks.find((h) => h.path.includes("hunks/parse"))
    assert.ok(parseFile)
    assert.equal(parseFile.hunkIndex, 1)
    assert.equal(parseFile.isNew, true)
    assert.equal(parseFile.oldStart, 0)
    assert.equal(parseFile.newStart, 1)

    const appFile = result.hunks.find((h) => h.path.includes("hunks-app"))
    assert.ok(appFile)
    assert.equal(appFile.hunkIndex, 1)
    assert.equal(appFile.oldStart, 40)
    assert.equal(appFile.newStart, 40)
  })

  it("parses a second hunk in the same file", () => {
    const diff = `diff --git a/foo.ts b/foo.ts
--- a/foo.ts
+++ b/foo.ts
@@ -1,3 +1,4 @@
 a
+b
 c
@@ -10,2 +11,3 @@
 x
+y
 z
`
    const result = parseDiffHunks(diff)
    assert.equal(result.summary.hunkCount, 2)
    assert.equal(result.hunks[0]?.path, "foo.ts")
    assert.equal(result.hunks[0]?.hunkIndex, 1)
    assert.equal(result.hunks[1]?.hunkIndex, 2)
    assert.equal(result.hunks[0]?.additions, 1)
    assert.equal(result.hunks[1]?.additions, 1)
  })

  it("skips binary files without hunks", () => {
    const result = parseDiffHunks(SAMPLE_HUNKS_DIFF)
    assert.ok(!result.hunks.some((h) => h.path.includes("logo.png")))
  })

  it("uses new-side line range for citations", () => {
    const diff = `diff --git a/lib/x.ts b/lib/x.ts
--- a/lib/x.ts
+++ b/lib/x.ts
@@ -10,5 +10,7 @@ export function foo() {
 unchanged
+added one
+added two
 unchanged
`
    const result = parseDiffHunks(diff)
    assert.equal(result.hunks.length, 1)
    const hunk = result.hunks[0]!
    const range = hunkCitationRange(hunk)
    assert.equal(range.startLine, 10)
    assert.equal(range.endLine, 16)
    assert.equal(formatHunkCitation(hunk), "10:16:lib/x.ts")
  })

  it("uses old-side range for deleted files", () => {
    const diff = `diff --git a/old.ts b/old.ts
deleted file mode 100644
--- a/old.ts
+++ /dev/null
@@ -5,3 +0,0 @@
 line
 more
 end
`
    const result = parseDiffHunks(diff)
    assert.equal(result.hunks.length, 1)
    const hunk = result.hunks[0]!
    assert.equal(hunk.isDeleted, true)
    assert.equal(formatHunkCitation(hunk), "5:7:old.ts")
  })

  it("warns on empty input", () => {
    const result = parseDiffHunks("  \n")
    assert.equal(result.hunks.length, 0)
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("formats markdown and citation lists", () => {
    const result = parseDiffHunks(SAMPLE_HUNKS_DIFF)
    const md = formatHunksMarkdown(result)
    assert.ok(md.includes("hunk(s)"))
    assert.ok(md.includes("Hunk 1:"))

    const citations = formatHunkCitations(result)
    assert.ok(citations.includes("lib/hunks/parse.ts"))
    assert.equal(formatHunkPaths(result), citations)
  })
})
