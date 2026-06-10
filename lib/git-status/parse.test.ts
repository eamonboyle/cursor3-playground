import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_GIT_STATUS_HUMAN,
  SAMPLE_GIT_STATUS_PORCELAIN,
} from "./defaults.ts"
import {
  entryDisplayPath,
  filterGitStatusEntries,
  formatGitAddCommands,
  formatGitStatusMarkdown,
  formatGitStatusPaths,
  parseGitStatus,
} from "./parse.ts"

describe("parseGitStatus", () => {
  it("parses porcelain sample with mixed buckets", () => {
    const result = parseGitStatus(SAMPLE_GIT_STATUS_PORCELAIN)
    assert.equal(result.format, "porcelain")
    assert.equal(result.branch, "cursor/cursor-testing-utility-26e2")
    assert.equal(result.summary.total, 11)
    assert.equal(result.summary.staged, 5)
    assert.equal(result.summary.unstaged, 2)
    assert.equal(result.summary.untracked, 3)
    assert.equal(result.summary.ignored, 1)
    assert.equal(result.summary.conflicted, 1)

    const renamed = result.entries.find((e) => e.kind === "renamed")
    assert.ok(renamed)
    assert.equal(renamed.oldPath, "lib/utils/format.ts")
    assert.equal(renamed.path, "lib/utils/format-path.ts")

    const both = result.entries.find((e) => e.path === "components/todo/todo-app.tsx")
    assert.ok(both)
    assert.deepEqual(both.buckets, ["staged", "unstaged"])
  })

  it("parses human-readable git status", () => {
    const result = parseGitStatus(SAMPLE_GIT_STATUS_HUMAN)
    assert.equal(result.format, "human")
    assert.equal(result.branch, "cursor/cursor-testing-utility-26e2")
    assert.ok(result.summary.staged >= 2)
    assert.ok(result.summary.unstaged >= 2)
    assert.ok(result.summary.untracked >= 2)
  })

  it("formats paths and markdown", () => {
    const result = parseGitStatus(SAMPLE_GIT_STATUS_PORCELAIN)
    const paths = formatGitStatusPaths(result, "staged")
    assert.ok(paths.includes("lib/playground/demos.ts"))
    assert.ok(!paths.includes("README.md"))

    const md = formatGitStatusMarkdown(result)
    assert.ok(md.includes("Staged"))
    assert.ok(md.includes("lib/utils/format.ts -> lib/utils/format-path.ts"))

    const add = formatGitAddCommands(result, "untracked")
    assert.ok(add.includes('git add "app/git-status/"'))
  })

  it("filters entries by bucket", () => {
    const result = parseGitStatus(SAMPLE_GIT_STATUS_PORCELAIN)
    const untracked = filterGitStatusEntries(result.entries, "untracked")
    assert.ok(untracked.every((e) => e.buckets.includes("untracked")))
    assert.equal(untracked.length, 3)
  })

  it("warns on empty input", () => {
    const result = parseGitStatus("")
    assert.equal(result.entries.length, 0)
    assert.ok(result.warnings.length > 0)
  })

  it("displays rename paths", () => {
    const entry = {
      path: "lib/new.ts",
      oldPath: "lib/old.ts",
      kind: "renamed" as const,
      buckets: ["staged" as const],
      sourceLine: 1,
      raw: "R  lib/old.ts -> lib/new.ts",
    }
    assert.equal(entryDisplayPath(entry), "lib/old.ts -> lib/new.ts")
  })
})
