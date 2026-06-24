import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_GIT_STASH_LIST } from "./defaults.ts"
import {
  filterGitStashEntries,
  formatStashApplyCommands,
  formatStashMarkdown,
  formatStashPopCommands,
  formatStashRefs,
  formatStashShowCommands,
  parseGitStashList,
} from "./parse.ts"

describe("parseGitStashList", () => {
  it("parses sample stash list with mixed kinds", () => {
    const result = parseGitStashList(SAMPLE_GIT_STASH_LIST)
    assert.equal(result.summary.total, 4)
    assert.equal(result.summary.wip, 2)
    assert.equal(result.summary.on, 1)
    assert.equal(result.summary.custom, 1)

    const latest = result.entries.find((e) => e.index === 0)
    assert.ok(latest)
    assert.equal(latest.kind, "wip")
    assert.equal(latest.branch, "cursor/cursor-testing-utility-72eb")
    assert.equal(latest.commit, "3ab8499")
    assert.ok(latest.message.includes("CODEOWNERS"))

    const onMain = result.entries.find((e) => e.index === 1)
    assert.ok(onMain)
    assert.equal(onMain.kind, "on")
    assert.equal(onMain.branch, "main")

    const custom = result.entries.find((e) => e.index === 2)
    assert.ok(custom)
    assert.equal(custom.kind, "custom")
    assert.equal(custom.message, "lint-stash")

    const detached = result.entries.find((e) => e.index === 3)
    assert.ok(detached)
    assert.equal(detached.branch, "(no branch)")
  })

  it("formats stash commands and refs", () => {
    const result = parseGitStashList(SAMPLE_GIT_STASH_LIST)
    const refs = formatStashRefs(result.entries)
    assert.ok(refs.includes("stash@{0}"))
    assert.ok(refs.includes("stash@{3}"))

    const show = formatStashShowCommands(result.entries.slice(0, 1))
    assert.equal(show, "git stash show -p stash@{0}")

    const apply = formatStashApplyCommands(result.entries.slice(0, 2))
    assert.ok(apply.includes("git stash apply stash@{0}"))
    assert.ok(apply.includes("git stash apply stash@{1}"))

    const pop = formatStashPopCommands(result.entries.slice(0, 1))
    assert.equal(pop, "git stash pop stash@{0}")
  })

  it("filters entries by kind", () => {
    const result = parseGitStashList(SAMPLE_GIT_STASH_LIST)
    const wip = filterGitStashEntries(result.entries, "wip")
    assert.equal(wip.length, 2)
    assert.ok(wip.every((e) => e.kind === "wip"))
  })

  it("formats markdown summary", () => {
    const result = parseGitStashList(SAMPLE_GIT_STASH_LIST)
    const md = formatStashMarkdown(result)
    assert.ok(md.includes("stash@{0}"))
    assert.ok(md.includes("lint-stash"))
  })

  it("warns on empty input", () => {
    const result = parseGitStashList("")
    assert.equal(result.entries.length, 0)
    assert.ok(result.warnings.length > 0)
  })
})
