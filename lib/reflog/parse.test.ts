import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { SAMPLE_GIT_REFLOG } from "./defaults.ts"
import {
  formatReflogCheckoutCommands,
  formatReflogHashes,
  formatReflogMarkdown,
  formatReflogResetCommands,
  parseReflogOutput,
  reflogLocation,
  reflogResetCommand,
} from "./parse.ts"

describe("parseReflogOutput", () => {
  it("parses git reflog sample", () => {
    const result = parseReflogOutput(SAMPLE_GIT_REFLOG)
    assert.equal(result.summary.entryCount, 10)
    assert.equal(result.summary.byOperation.commit, 2)
    assert.equal(result.summary.byOperation.reset, 1)
    assert.equal(result.summary.byOperation.checkout, 1)
    assert.equal(result.summary.byOperation.rebase, 2)
    assert.equal(result.summary.byOperation.merge, 1)
    assert.equal(result.summary.byOperation["cherry-pick"], 1)
    assert.equal(result.summary.byOperation.pull, 1)
    assert.equal(result.summary.byOperation.branch, 1)
  })

  it("extracts hash, index, action, and description", () => {
    const result = parseReflogOutput(SAMPLE_GIT_REFLOG)
    const latest = result.entries[0]
    assert.ok(latest)
    assert.equal(latest.reflogIndex, 0)
    assert.equal(latest.operation, "commit")
    assert.equal(latest.action, "commit")
    assert.ok(latest.description.includes("recover lost work"))
    assert.equal(reflogLocation(latest), "HEAD@{0}")
  })

  it("classifies rebase sub-actions", () => {
    const result = parseReflogOutput(SAMPLE_GIT_REFLOG)
    const rebaseFinish = result.entries.find((e) =>
      e.description.includes("returning to refs/heads/main"),
    )
    assert.ok(rebaseFinish)
    assert.equal(rebaseFinish.operation, "rebase")
    assert.equal(rebaseFinish.action, "rebase (finish)")
  })

  it("formats recovery commands", () => {
    const result = parseReflogOutput(SAMPLE_GIT_REFLOG)
    const entry = result.entries[2]
    assert.ok(entry)
    assert.equal(
      reflogResetCommand(entry),
      `git reset --hard HEAD@{${entry.reflogIndex}}`,
    )
    const resetCommands = formatReflogResetCommands(result)
    assert.ok(resetCommands.includes("git reset --hard HEAD@{0}"))
    const checkoutCommands = formatReflogCheckoutCommands(result)
    assert.ok(checkoutCommands.includes("git checkout cafebabe"))
  })

  it("formats hashes and markdown report", () => {
    const result = parseReflogOutput(SAMPLE_GIT_REFLOG)
    const hashes = formatReflogHashes(result)
    assert.ok(hashes.includes("a1b2c3d"))
    const md = formatReflogMarkdown(result)
    assert.ok(md.includes("10** reflog entry"))
    assert.ok(md.includes("recover lost work"))
  })

  it("warns on empty input", () => {
    const result = parseReflogOutput("")
    assert.equal(result.entries.length, 0)
    assert.ok(result.warnings.some((w) => w.includes("git reflog")))
  })
})
