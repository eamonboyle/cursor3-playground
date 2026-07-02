import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_STASH_LIST } from "./defaults.ts"
import {
  formatStashApplyCommands,
  formatStashMarkdown,
  formatStashPatchCommands,
  formatStashRefs,
  formatStashShowCommands,
  parseStashList,
} from "./parse.ts"

describe("parseStashList", () => {
  it("parses sample stash list with mixed kinds", () => {
    const result = parseStashList(SAMPLE_STASH_LIST)
    assert.equal(result.summary.total, 4)
    assert.equal(result.summary.byKind.wip, 1)
    assert.equal(result.summary.byKind.on, 1)
    assert.equal(result.summary.byKind.untracked, 1)
    assert.equal(result.summary.byKind.autostash, 1)

    const wip = result.entries.find((entry) => entry.kind === "wip")
    assert.ok(wip)
    assert.equal(wip.ref, "stash@{0}")
    assert.equal(wip.branch, "cursor/cursor-testing-utility-8f4f")
    assert.ok(wip.message.includes("git stash lab"))

    const on = result.entries.find((entry) => entry.kind === "on")
    assert.ok(on)
    assert.equal(on.branch, "main")
    assert.equal(on.message, "wip before switching branches")
  })

  it("formats refs and markdown", () => {
    const result = parseStashList(SAMPLE_STASH_LIST)
    const refs = formatStashRefs(result)
    assert.ok(refs.includes("stash@{0}"))
    assert.ok(refs.includes("stash@{3}"))

    const md = formatStashMarkdown(result)
    assert.ok(md.includes("stash@{0}"))
    assert.ok(md.includes("autostash"))
  })

  it("formats apply, pop, show, and patch commands", () => {
    const result = parseStashList(SAMPLE_STASH_LIST)
    const apply = formatStashApplyCommands(result, "apply")
    assert.ok(apply.includes("git stash apply stash@{0}"))

    const pop = formatStashApplyCommands(result, "pop")
    assert.ok(pop.includes("git stash pop stash@{1}"))

    const show = formatStashShowCommands(result)
    assert.ok(show.includes("git stash show --name-status stash@{2}"))

    const patch = formatStashPatchCommands(result)
    assert.ok(patch.includes("git stash show -p stash@{0}"))
  })

  it("warns on empty input", () => {
    const result = parseStashList("")
    assert.equal(result.entries.length, 0)
    assert.ok(result.warnings.length > 0)
  })
})
