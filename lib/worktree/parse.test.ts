import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_GIT_WORKTREE_LIST,
  SAMPLE_GIT_WORKTREE_PORCELAIN,
} from "./defaults.ts"
import {
  filterWorktreeEntries,
  formatWorktreeBranches,
  formatWorktreeMarkdown,
  formatWorktreePruneCommands,
  formatWorktreeRemoveCommands,
  formatWorktreeUnlockCommands,
  parseWorktreeOutput,
  worktreeAddCommand,
  worktreeListCommand,
  worktreeRemoveCommand,
} from "./parse.ts"

describe("parseWorktreeOutput", () => {
  it("parses git worktree list sample", () => {
    const result = parseWorktreeOutput(SAMPLE_GIT_WORKTREE_LIST)
    assert.equal(result.format, "list")
    assert.equal(result.summary.total, 6)
    assert.equal(result.summary.normal, 2)
    assert.equal(result.summary.bare, 1)
    assert.equal(result.summary.detached, 1)
    assert.equal(result.summary.locked, 1)
    assert.equal(result.summary.prunable, 1)

    const main = result.entries.find((entry) => entry.branch === "main")
    assert.ok(main)
    assert.equal(main.state, "normal")
    assert.ok(main.isMain)
    assert.equal(main.shortHash, "a1b2c3d")

    const locked = result.entries.find((entry) => entry.state === "locked")
    assert.ok(locked)
    assert.equal(locked.branch, "release/1.0")
  })

  it("parses git worktree list --porcelain sample", () => {
    const result = parseWorktreeOutput(SAMPLE_GIT_WORKTREE_PORCELAIN)
    assert.equal(result.format, "porcelain")
    assert.equal(result.summary.total, 6)

    const feature = result.entries.find((entry) =>
      entry.branch?.includes("worktree-lab"),
    )
    assert.ok(feature)
    assert.equal(feature.state, "normal")
    assert.equal(feature.ref, "refs/heads/cursor/worktree-lab")
  })

  it("filters entries by state", () => {
    const result = parseWorktreeOutput(SAMPLE_GIT_WORKTREE_LIST)
    const prunable = filterWorktreeEntries(result.entries, "prunable")
    assert.equal(prunable.length, 1)
    assert.equal(prunable[0]?.state, "prunable")
  })

  it("formats remove commands excluding main worktree", () => {
    const result = parseWorktreeOutput(SAMPLE_GIT_WORKTREE_LIST)
    const commands = formatWorktreeRemoveCommands(result)
    assert.match(commands, /git worktree remove \/Users\/dev\/my-app-feature/)
    assert.doesNotMatch(commands, /git worktree remove \/Users\/dev\/my-app\s/)
  })

  it("formats prune and unlock commands", () => {
    const result = parseWorktreeOutput(SAMPLE_GIT_WORKTREE_LIST)
    const prune = formatWorktreePruneCommands(result)
    assert.match(prune, /git worktree prune/)
    assert.match(prune, /git worktree remove \/Users\/dev\/my-app-stale/)

    const unlock = formatWorktreeUnlockCommands(result)
    assert.equal(
      unlock,
      "git worktree unlock /Users/dev/my-app-locked",
    )
  })

  it("formats branches and markdown", () => {
    const result = parseWorktreeOutput(SAMPLE_GIT_WORKTREE_LIST)
    const branches = formatWorktreeBranches(result)
    assert.match(branches, /main/)
    assert.match(branches, /cursor\/worktree-lab/)

    const md = formatWorktreeMarkdown(result)
    assert.match(md, /6\*\* worktree/)
    assert.match(md, /prunable/)
  })

  it("builds worktree helper commands", () => {
    assert.equal(worktreeListCommand(), "git worktree list")
    assert.equal(
      worktreeAddCommand("../feature", "feature/x"),
      "git worktree add ../feature feature/x",
    )
    assert.equal(
      worktreeRemoveCommand("/tmp/wt", true),
      "git worktree remove --force /tmp/wt",
    )
  })

  it("warns on empty input", () => {
    const result = parseWorktreeOutput("")
    assert.equal(result.entries.length, 0)
    assert.ok(result.warnings.some((warning) => warning.includes("git worktree list")))
  })
})
