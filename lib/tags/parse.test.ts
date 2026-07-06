import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_GIT_TAG_ANNOTATED,
  SAMPLE_GIT_TAG_FORMAT,
  SAMPLE_GIT_TAG_PLAIN,
} from "./defaults.ts"
import {
  formatTagCheckoutCommands,
  formatTagDeleteCommands,
  formatTagMarkdown,
  formatTagNames,
  formatTagPushCommands,
  filterTagEntries,
  parseTagOutput,
} from "./parse.ts"

describe("parseTagOutput", () => {
  it("parses annotated git tag -n output", () => {
    const result = parseTagOutput(SAMPLE_GIT_TAG_ANNOTATED)
    assert.equal(result.summary.total, 4)
    assert.equal(result.summary.annotated, 4)
    assert.equal(result.summary.semver, 3)
    assert.equal(result.format, "annotated")

    const stable = result.entries.find((entry) => entry.name === "v1.0.0")
    assert.ok(stable)
    assert.equal(stable.kind, "annotated")
    assert.ok(stable.message?.includes("stable"))
    assert.equal(stable.isSemver, true)

    const smoke = result.entries.find((entry) => entry.name === "cursor-test")
    assert.ok(smoke)
    assert.equal(smoke.isSemver, false)
  })

  it("parses plain git tag list", () => {
    const result = parseTagOutput(SAMPLE_GIT_TAG_PLAIN)
    assert.equal(result.summary.total, 4)
    assert.equal(result.summary.lightweight, 4)
    assert.equal(result.format, "plain")

    for (const entry of result.entries) {
      assert.equal(entry.kind, "lightweight")
      assert.equal(entry.message, undefined)
    }
  })

  it("parses custom --format output with hash and date", () => {
    const result = parseTagOutput(SAMPLE_GIT_TAG_FORMAT)
    assert.equal(result.summary.total, 4)
    assert.equal(result.format, "format")

    const latest = result.entries[0]
    assert.ok(latest)
    assert.equal(latest.name, "v1.1.0")
    assert.equal(latest.hash, "a1b2c3d")
    assert.equal(latest.date, "2026-07-05")
    assert.ok(latest.message?.includes("reflog"))
  })

  it("filters semver tags", () => {
    const result = parseTagOutput(SAMPLE_GIT_TAG_ANNOTATED)
    const semver = filterTagEntries(result.entries, "semver")
    assert.equal(semver.length, 3)
    assert.ok(semver.every((entry) => entry.isSemver))
  })

  it("formats names, checkout, push, delete, and markdown", () => {
    const result = parseTagOutput(SAMPLE_GIT_TAG_ANNOTATED)
    const names = formatTagNames(result)
    assert.ok(names.includes("v1.1.0"))

    const checkout = formatTagCheckoutCommands(result, { filter: "semver" })
    assert.ok(checkout.includes("git checkout tags/v1.0.0"))

    const push = formatTagPushCommands(result, { filter: "semver" })
    assert.ok(push.includes("git push origin v1.1.0"))

    const del = formatTagDeleteCommands(result, { filter: "semver" })
    assert.ok(del.includes("git tag -d v0.0.1"))
    assert.ok(del.includes("git push origin :refs/tags/v1.1.0"))

    const md = formatTagMarkdown(result)
    assert.ok(md.includes("v1.0.0"))
    assert.ok(md.includes("annotated"))
  })

  it("warns on empty input", () => {
    const result = parseTagOutput("")
    assert.equal(result.entries.length, 0)
    assert.ok(result.warnings.length > 0)
  })
})
