import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_GIT_BRANCH_PLAIN,
  SAMPLE_GIT_BRANCH_VERBOSE,
} from "./defaults.ts"
import {
  branchCheckoutCommand,
  branchDeleteCommand,
  filterBranchEntries,
  formatBranchCheckoutCommands,
  formatBranchDeleteCommands,
  formatBranchMarkdown,
  formatBranchPruneHint,
  parseBranchOutput,
} from "./parse.ts"

describe("parseBranchOutput", () => {
  it("parses git branch -vv sample", () => {
    const result = parseBranchOutput(SAMPLE_GIT_BRANCH_VERBOSE)
    assert.equal(result.format, "verbose")
    assert.equal(result.summary.local, 6)
    assert.equal(result.summary.remote, 3)
    assert.equal(result.summary.current, "main")
    assert.equal(result.summary.gone, 2)
    assert.equal(result.summary.ahead, 1)
    assert.equal(result.summary.behind, 1)
  })

  it("extracts tracking ahead/behind and gone states", () => {
    const result = parseBranchOutput(SAMPLE_GIT_BRANCH_VERBOSE)
    const ahead = result.entries.find(
      (e) => e.name === "cursor/cursor-testing-utility-9c45",
    )
    assert.ok(ahead)
    assert.equal(ahead.trackingState, "ahead")
    assert.equal(ahead.ahead, 2)
    assert.equal(ahead.tracking, "origin/cursor/cursor-testing-utility-9c45")

    const behind = result.entries.find((e) => e.name === "feature/auth")
    assert.ok(behind)
    assert.equal(behind.trackingState, "behind")
    assert.equal(behind.behind, 3)

    const gone = result.entries.find((e) => e.name === "merged/feature")
    assert.ok(gone)
    assert.equal(gone.trackingState, "gone")
  })

  it("parses plain git branch -a listing", () => {
    const result = parseBranchOutput(SAMPLE_GIT_BRANCH_PLAIN)
    assert.equal(result.format, "plain")
    assert.equal(result.summary.local, 3)
    assert.equal(result.summary.remote, 3)
    const current = result.entries.find((e) => e.isCurrent)
    assert.ok(current)
    assert.equal(current.name, "main")
  })

  it("skips remotes/HEAD pointer lines", () => {
    const result = parseBranchOutput(SAMPLE_GIT_BRANCH_PLAIN)
    assert.ok(!result.entries.some((e) => e.name.includes("HEAD ->")))
  })

  it("filters by kind and tracking state", () => {
    const result = parseBranchOutput(SAMPLE_GIT_BRANCH_VERBOSE)
    assert.equal(filterBranchEntries(result.entries, "local").length, 6)
    assert.equal(filterBranchEntries(result.entries, "remote").length, 3)
    assert.equal(filterBranchEntries(result.entries, "gone").length, 2)
    assert.equal(filterBranchEntries(result.entries, "ahead").length, 1)
    assert.equal(filterBranchEntries(result.entries, "behind").length, 1)
  })

  it("formats checkout and delete commands", () => {
    const result = parseBranchOutput(SAMPLE_GIT_BRANCH_VERBOSE)
    const local = result.entries.find((e) => e.name === "main")
    assert.ok(local)
    assert.equal(branchCheckoutCommand(local), "git checkout main")
    assert.equal(branchDeleteCommand(local), "git branch -d main")
    assert.equal(branchDeleteCommand(local, true), "git branch -D main")

    const remote = result.entries.find(
      (e) => e.name === "remotes/origin/feature/auth",
    )
    assert.ok(remote)
    assert.equal(
      branchCheckoutCommand(remote),
      "git checkout --track origin/feature/auth",
    )
    assert.equal(
      branchDeleteCommand(remote),
      "git push origin --delete feature/auth",
    )

    const checkouts = formatBranchCheckoutCommands(result, { filter: "local" })
    assert.ok(checkouts.includes("git checkout main"))
    const deletes = formatBranchDeleteCommands(result, { filter: "local" })
    assert.ok(deletes.includes("git branch -d main"))
  })

  it("suggests prune workflow for gone upstreams", () => {
    const result = parseBranchOutput(SAMPLE_GIT_BRANCH_VERBOSE)
    const hint = formatBranchPruneHint(result)
    assert.ok(hint.includes("git fetch --prune"))
    assert.ok(hint.includes("git branch -d merged/feature"))
  })

  it("formats markdown report", () => {
    const result = parseBranchOutput(SAMPLE_GIT_BRANCH_VERBOSE)
    const md = formatBranchMarkdown(result)
    assert.ok(md.includes("9** branch"))
    assert.ok(md.includes("cursor/cursor-testing-utility-9c45"))
  })

  it("warns on empty input", () => {
    const result = parseBranchOutput("")
    assert.equal(result.entries.length, 0)
    assert.ok(result.warnings.some((w) => w.includes("git branch")))
  })
})
