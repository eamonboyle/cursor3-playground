import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_STASH_LIST } from "./defaults.ts"
import {
  formatStashCommand,
  formatStashMarkdown,
  formatStashRefs,
  parseStashList,
  stashDisplayTitle,
} from "./parse.ts"

describe("parseStashList", () => {
  it("parses sample stash list with mixed kinds", () => {
    const result = parseStashList(SAMPLE_STASH_LIST)
    assert.equal(result.summary.total, 5)
    assert.equal(result.summary.byKind.wip, 2)
    assert.equal(result.summary.byKind.branch, 1)
    assert.equal(result.summary.byKind.untracked, 1)
    assert.equal(result.summary.byKind.custom, 1)

    const newest = result.entries[0]
    assert.ok(newest)
    assert.equal(newest.ref, "stash@{0}")
    assert.equal(newest.kind, "wip")
    assert.equal(newest.branch, "cursor/cursor-testing-utility-e520")
    assert.equal(newest.commit, "3ab8499")
    assert.ok(newest.message.includes("CODEOWNERS"))

    const custom = result.entries.find((entry) => entry.kind === "custom")
    assert.ok(custom)
    assert.equal(custom.message, "lint-staged automatic backup")

    const noBranch = result.entries.find((entry) => entry.branch === "(no branch)")
    assert.ok(noBranch)
    assert.equal(noBranch.kind, "wip")
  })

  it("formats markdown and git commands", () => {
    const result = parseStashList(SAMPLE_STASH_LIST)
    const md = formatStashMarkdown(result)
    assert.ok(md.includes("stash@{0}"))
    assert.ok(md.includes("wip: 2"))

    const apply = formatStashCommand(result, "apply")
    assert.ok(apply.includes("git stash apply stash@{0}"))
    assert.ok(apply.includes("git stash apply stash@{4}"))

    const refs = formatStashRefs(result)
    assert.ok(refs.includes("stash@{0}"))
    assert.equal(refs.split("\n").length, 5)
  })

  it("warns on empty input", () => {
    const result = parseStashList("")
    assert.equal(result.entries.length, 0)
    assert.ok(result.warnings.length > 0)
  })

  it("displays fallback titles", () => {
    const entry = {
      index: 0,
      ref: "stash@{0}",
      kind: "custom" as const,
      message: "",
      branch: "main",
      sourceLine: 1,
      raw: "stash@{0}: On main: abc1234",
    }
    assert.equal(stashDisplayTitle({ ...entry, message: "hello" }), "hello")
    assert.equal(stashDisplayTitle({ ...entry, message: "" }), "main")
  })
})
