import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SAMPLE_GIT_LOG_FULL,
  SAMPLE_GIT_LOG_ONELINE,
} from "./defaults.ts"
import {
  formatGitLogMarkdown,
  formatGitLogReleaseNotes,
  formatGitLogSubjects,
  parseGitLogOutput,
} from "./parse.ts"

describe("parseGitLogOutput", () => {
  it("parses git log --oneline sample", () => {
    const result = parseGitLogOutput(SAMPLE_GIT_LOG_ONELINE)
    assert.equal(result.summary.commitCount, 7)
    assert.equal(result.summary.byType.feat, 3)
    assert.equal(result.summary.byType.chore, 1)
    assert.equal(result.summary.byType.fix, 1)
    assert.equal(result.summary.byType.docs, 1)
    assert.equal(result.summary.mergeCount, 1)
    assert.equal(result.summary.breakingCount, 1)
    assert.ok(result.commits.some((c) => c.hash.startsWith("5b0acf8")))
  })

  it("parses full git log blocks", () => {
    const result = parseGitLogOutput(SAMPLE_GIT_LOG_FULL)
    assert.equal(result.summary.commitCount, 2)
    assert.ok(result.commits.some((c) => c.type === "feat"))
    assert.ok(result.commits.some((c) => c.type === "chore"))
  })

  it("hides merge commits when requested", () => {
    const result = parseGitLogOutput(SAMPLE_GIT_LOG_ONELINE, {
      hideMerges: true,
    })
    assert.equal(result.summary.commitCount, 6)
    assert.ok(result.commits.every((c) => !c.isMerge))
  })

  it("filters by conventional type", () => {
    const result = parseGitLogOutput(SAMPLE_GIT_LOG_ONELINE, {
      typeFilter: "feat",
    })
    assert.equal(result.summary.commitCount, 3)
    assert.ok(result.commits.every((c) => c.type === "feat"))
  })

  it("detects breaking changes", () => {
    const result = parseGitLogOutput(SAMPLE_GIT_LOG_ONELINE)
    const breaking = result.commits.find((c) => c.hash.startsWith("a1b2c3d"))
    assert.ok(breaking)
    assert.equal(breaking.breaking, true)
    assert.equal(breaking.type, "fix")
    assert.equal(breaking.scope, "auth")
  })

  it("formats release notes grouped by type", () => {
    const result = parseGitLogOutput(SAMPLE_GIT_LOG_ONELINE, {
      hideMerges: true,
    })
    const notes = formatGitLogReleaseNotes(result)
    assert.ok(notes.includes("### Breaking changes"))
    assert.ok(notes.includes("drop legacy session cookie support"))
    assert.ok(notes.includes("### Features"))
    assert.ok(notes.includes("### Bug fixes"))
    assert.ok(notes.includes("### Documentation"))
  })

  it("formats subjects and markdown report", () => {
    const result = parseGitLogOutput(SAMPLE_GIT_LOG_ONELINE, {
      hideMerges: true,
    })
    const subjects = formatGitLogSubjects(result)
    assert.ok(subjects.includes("add Prettier output lab"))
    const md = formatGitLogMarkdown(result)
    assert.ok(md.includes("6** commit(s)"))
    assert.ok(md.includes("`5b0acf8`"))
  })

  it("warns on empty input", () => {
    const result = parseGitLogOutput("")
    assert.equal(result.commits.length, 0)
    assert.ok(result.warnings.some((w) => w.includes("Paste output")))
  })
})
