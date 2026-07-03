import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_BLAME_FILEPATH, SAMPLE_BLAME_OUTPUT } from "./defaults.ts"
import {
  blameCitation,
  formatBlameAuthors,
  formatBlameCitations,
  formatBlameHashes,
  formatBlameMarkdown,
  parseBlameOutput,
} from "./parse.ts"

describe("parseBlameOutput", () => {
  it("parses standard git blame -l output", () => {
    const result = parseBlameOutput(SAMPLE_BLAME_OUTPUT, {
      filepath: SAMPLE_BLAME_FILEPATH,
    })
    assert.equal(result.summary.totalLines, 12)
    assert.equal(result.summary.authorCount, 4)
    assert.equal(result.lines[0]?.isBoundary, true)
    assert.equal(result.lines[0]?.author, "Not Committed Yet")
    assert.equal(result.lines[2]?.author, "Ada Lovelace")
    assert.equal(result.lines[5]?.author, "Grace Hopper")
  })

  it("groups consecutive lines by author into ranges", () => {
    const result = parseBlameOutput(SAMPLE_BLAME_OUTPUT, {
      filepath: SAMPLE_BLAME_FILEPATH,
    })
    const ada = result.groups.find((g) => g.author === "Ada Lovelace")
    assert.ok(ada)
    assert.equal(ada.lineCount, 5)
    assert.ok(ada.ranges.some((r) => r.start === 3 && r.end === 5))
    assert.ok(ada.ranges.some((r) => r.start === 9 && r.end === 9))
  })

  it("filters by author substring", () => {
    const result = parseBlameOutput(SAMPLE_BLAME_OUTPUT, {
      filepath: SAMPLE_BLAME_FILEPATH,
      authorFilter: "hopper",
    })
    assert.equal(result.summary.totalLines, 3)
    assert.equal(result.summary.authorCount, 1)
    assert.ok(result.groups.every((g) => /hopper/i.test(g.author)))
  })

  it("parses porcelain blame blocks", () => {
    const porcelain = `deadbeefdeadbeefdeadbeefdeadbeefdeadbeef
author Ada Lovelace
author-mail <ada@example.com>
author-time 1710000000
author-tz -0800
committer Ada Lovelace
committer-mail <ada@example.com>
committer-time 1710000000
committer-tz -0800
summary Add tags
filename lib/todo/parse.ts
\texport const TODO_TAGS = [
\t  "TODO",
`
    const result = parseBlameOutput(porcelain)
    assert.equal(result.summary.totalLines, 2)
    assert.equal(result.filepath, "lib/todo/parse.ts")
    assert.equal(result.lines[0]?.content, 'export const TODO_TAGS = [')
  })

  it("warns on empty input", () => {
    const result = parseBlameOutput("  \n")
    assert.equal(result.lines.length, 0)
    assert.ok(result.warnings.some((w) => /paste/i.test(w)))
  })

  it("builds citation fences", () => {
    const citation = blameCitation("lib/foo.ts", 10, 12)
    assert.equal(citation, "```10:12:lib/foo.ts\n```")

    const result = parseBlameOutput(SAMPLE_BLAME_OUTPUT, {
      filepath: SAMPLE_BLAME_FILEPATH,
    })
    const citations = formatBlameCitations(result, 3)
    assert.match(citations, /```1:1:lib\/todo\/parse\.ts/)
    assert.match(citations, /```3:5:lib\/todo\/parse\.ts/)
  })

  it("formats markdown, authors, and hashes", () => {
    const result = parseBlameOutput(SAMPLE_BLAME_OUTPUT, {
      filepath: SAMPLE_BLAME_FILEPATH,
    })
    const md = formatBlameMarkdown(result)
    assert.match(md, /Git blame summary/)
    assert.match(md, /Ada Lovelace/)

    const authors = formatBlameAuthors(result)
    assert.match(authors, /Ada Lovelace\t5/)

    const hashes = formatBlameHashes(result)
    assert.ok(hashes.split("\n").length >= 3)
  })
})
