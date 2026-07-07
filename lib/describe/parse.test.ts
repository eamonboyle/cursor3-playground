import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_GIT_DESCRIBE_LONG,
  SAMPLE_GIT_DESCRIBE_SHORT,
} from "./defaults.ts"
import {
  checkoutHashCommand,
  checkoutTagCommand,
  describeLongCommand,
  filterDescribeEntries,
  formatDescribeMarkdown,
  parseDescribeOutput,
} from "./parse.ts"

describe("parseDescribeOutput", () => {
  it("parses long describe with tag, commits ahead, and hash", () => {
    const result = parseDescribeOutput(SAMPLE_GIT_DESCRIBE_LONG)
    assert.equal(result.summary.total, 5)
    assert.equal(result.summary.exactTag, 1)
    assert.equal(result.summary.aheadOfTag, 3)
    assert.equal(result.summary.hashOnly, 1)
    assert.equal(result.summary.semver, 3)

    const exact = result.entries.find((entry) => entry.raw === "v1.4.2")
    assert.ok(exact)
    assert.equal(exact.kind, "exact-tag")
    assert.equal(exact.tag, "v1.4.2")
    assert.equal(exact.isSemverTag, true)

    const ahead = result.entries.find((entry) =>
      entry.raw.startsWith("v1.4.2-12-g"),
    )
    assert.ok(ahead)
    assert.equal(ahead.kind, "ahead-of-tag")
    assert.equal(ahead.tag, "v1.4.2")
    assert.equal(ahead.commitsAhead, 12)
    assert.equal(ahead.hash, "3c4d5e6")

    const longHash = result.entries.find(
      (entry) => entry.raw === "v1.4.2-12-g3c4d5e6f7890abcd1234567890abcd123456",
    )
    assert.ok(longHash)
    assert.equal(longHash.hash, "3c4d5e6f7890abcd1234567890abcd123456")

    const hyphenTag = result.entries.find(
      (entry) => entry.raw === "release-candidate-2-3-gabcdef0",
    )
    assert.ok(hyphenTag)
    assert.equal(hyphenTag.tag, "release-candidate-2")
    assert.equal(hyphenTag.commitsAhead, 3)
    assert.equal(hyphenTag.hash, "abcdef0")

    const hashOnly = result.entries.find(
      (entry) =>
        entry.raw === "a1b2c3d4e5f6789012345678901234567890abcd",
    )
    assert.ok(hashOnly)
    assert.equal(hashOnly.kind, "hash-only")
  })

  it("parses short describe without trailing hash", () => {
    const result = parseDescribeOutput(SAMPLE_GIT_DESCRIBE_SHORT)
    assert.equal(result.summary.exactTag, 1)
    assert.equal(result.summary.aheadOfTag, 2)

    const ahead = result.entries.find((entry) => entry.raw === "v2.0.0-7")
    assert.ok(ahead)
    assert.equal(ahead.kind, "ahead-of-tag")
    assert.equal(ahead.commitsAhead, 7)
    assert.equal(ahead.hash, undefined)

    const nightly = result.entries.find(
      (entry) => entry.raw === "nightly-2026-07-01-4",
    )
    assert.ok(nightly)
    assert.equal(nightly.tag, "nightly-2026-07-01")
    assert.equal(nightly.commitsAhead, 4)
  })

  it("filters entries by kind", () => {
    const result = parseDescribeOutput(SAMPLE_GIT_DESCRIBE_LONG)
    assert.equal(
      filterDescribeEntries(result.entries, "ahead-of-tag").length,
      3,
    )
    assert.equal(
      filterDescribeEntries(result.entries, "hash-only").length,
      1,
    )
  })

  it("builds checkout and describe commands", () => {
    const result = parseDescribeOutput("v1.0.0-2-gdeadbeef")
    const entry = result.entries[0]
    assert.ok(entry)
    assert.equal(checkoutTagCommand(entry), "git checkout tags/v1.0.0")
    assert.equal(checkoutHashCommand(entry), "git checkout deadbeef")
    assert.equal(
      describeLongCommand(),
      "git describe --tags --long --always HEAD",
    )
  })

  it("formats markdown summary", () => {
    const result = parseDescribeOutput("v1.0.0\nv1.0.0-1-gabc1234")
    const md = formatDescribeMarkdown(result)
    assert.ok(md.includes("exact tag"))
    assert.ok(md.includes("`v1.0.0`"))
    assert.ok(md.includes("ahead-of-tag"))
  })
})
